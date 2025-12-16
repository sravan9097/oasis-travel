-- =====================================================
-- RPC FUNCTIONS FOR PRODUCTS AND PACKAGES
-- =====================================================
-- These functions are used by the AI bot to query
-- available packages and generate quote suggestions.

-- Function to search destination packages
create or replace function search_packages(
  p_destination text default null,
  p_min_nights int default null,
  p_max_nights int default null,
  p_hotel_class text default null,
  p_max_price numeric default null,
  p_tags text[] default null,
  p_limit int default 10
)
returns setof destination_packages
language sql
security definer
stable
as $$
  select *
  from destination_packages
  where active = true
    and (p_destination is null or lower(destination) like '%' || lower(p_destination) || '%')
    and (p_min_nights is null or nights >= p_min_nights)
    and (p_max_nights is null or nights <= p_max_nights)
    and (p_hotel_class is null or hotel_class = p_hotel_class)
    and (p_max_price is null or base_price <= p_max_price)
    and (p_tags is null or tags && p_tags)
    and (valid_from is null or valid_from <= current_date)
    and (valid_until is null or valid_until >= current_date)
  order by popularity_score desc, base_price asc
  limit p_limit;
$$;

comment on function search_packages is 'Search destination packages with filters for AI bot';

-- Function to get package with all components
create or replace function get_package_details(p_package_id uuid)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_package destination_packages%rowtype;
  v_components jsonb;
  v_result jsonb;
begin
  -- Get package
  select * into v_package
  from destination_packages
  where id = p_package_id and active = true;
  
  if not found then
    return null;
  end if;
  
  -- Get components with vendor info
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', pc.id,
      'day_no', pc.day_no,
      'component_type', pc.component_type,
      'description', pc.description,
      'quantity', pc.quantity,
      'unit_price', pc.unit_price,
      'vendor', case when v.id is not null then
        jsonb_build_object('id', v.id, 'name', v.name, 'type', v.type)
      else null end,
      'product', case when p.id is not null then
        jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category)
      else null end
    )
    order by pc.day_no, pc.component_type
  ), '[]'::jsonb)
  into v_components
  from package_components pc
  left join vendors v on v.id = pc.vendor_id
  left join products p on p.id = pc.product_id
  where pc.package_id = p_package_id;
  
  -- Build result
  v_result := jsonb_build_object(
    'id', v_package.id,
    'destination', v_package.destination,
    'title', v_package.title,
    'description', v_package.description,
    'nights', v_package.nights,
    'base_price', v_package.base_price,
    'currency', v_package.currency,
    'hotel_class', v_package.hotel_class,
    'cab_type', v_package.cab_type,
    'inclusions', v_package.inclusions,
    'exclusions', v_package.exclusions,
    'highlights', v_package.highlights,
    'itinerary', v_package.itinerary_json,
    'images', v_package.images,
    'tags', v_package.tags,
    'components', v_components
  );
  
  return v_result;
end;
$$;

comment on function get_package_details is 'Get full package details with components';

-- Function to get vendor products by destination
create or replace function get_products_by_destination(
  p_destination text,
  p_category text default null,
  p_active_only boolean default true
)
returns setof products
language sql
security definer
stable
as $$
  select *
  from products
  where (p_active_only = false or active = true)
    and lower(destination) like '%' || lower(p_destination) || '%'
    and (p_category is null or category = p_category)
  order by base_price asc;
$$;

comment on function get_products_by_destination is 'Get vendor products for a destination';

-- Function to calculate package price based on travel dates and pax
create or replace function calculate_package_price(
  p_package_id uuid,
  p_start_date date,
  p_pax_adults int,
  p_pax_children int default 0
)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_package destination_packages%rowtype;
  v_base_total numeric;
  v_taxes numeric;
  v_grand_total numeric;
  v_per_person numeric;
begin
  -- Get package
  select * into v_package
  from destination_packages
  where id = p_package_id and active = true;
  
  if not found then
    return jsonb_build_object('error', 'Package not found');
  end if;
  
  -- Calculate base price
  v_base_total := v_package.base_price * p_pax_adults;
  
  -- Children at 50% (simplified)
  v_base_total := v_base_total + (v_package.base_price * 0.5 * p_pax_children);
  
  -- Add taxes (5% GST simplified)
  v_taxes := v_base_total * 0.05;
  v_grand_total := v_base_total + v_taxes;
  
  v_per_person := v_grand_total / (p_pax_adults + p_pax_children);
  
  return jsonb_build_object(
    'package_id', p_package_id,
    'base_total', v_base_total,
    'taxes', v_taxes,
    'grand_total', v_grand_total,
    'per_person', round(v_per_person),
    'currency', v_package.currency,
    'pax_adults', p_pax_adults,
    'pax_children', p_pax_children,
    'nights', v_package.nights,
    'start_date', p_start_date
  );
end;
$$;

comment on function calculate_package_price is 'Calculate package price for given travel dates and pax';

-- Function to create draft quote from AI suggestion
create or replace function create_draft_quote(
  p_lead_id uuid,
  p_package_id uuid default null,
  p_suggested_items jsonb default '[]'::jsonb,
  p_total_amount numeric default 0,
  p_confidence_score numeric default 0.8,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_draft_id uuid;
begin
  insert into draft_quotes (
    lead_id,
    package_id,
    suggested_items,
    total_amount,
    confidence_score,
    notes
  ) values (
    p_lead_id,
    p_package_id,
    p_suggested_items,
    p_total_amount,
    p_confidence_score,
    p_notes
  )
  returning id into v_draft_id;
  
  return v_draft_id;
end;
$$;

comment on function create_draft_quote is 'Create AI-generated draft quote for admin approval';

-- Function to approve draft quote and create actual quote
create or replace function approve_draft_quote(
  p_draft_id uuid,
  p_adjustments jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_draft draft_quotes%rowtype;
  v_quote_id uuid;
  v_version int;
  v_items jsonb;
begin
  -- Get draft
  select * into v_draft
  from draft_quotes
  where id = p_draft_id and status = 'pending';
  
  if not found then
    raise exception 'Draft quote not found or already processed';
  end if;
  
  -- Get next version for this lead
  select coalesce(max(version), 0) + 1 into v_version
  from quotes
  where lead_id = v_draft.lead_id;
  
  -- Apply adjustments if provided
  v_items := case when p_adjustments is not null 
    then p_adjustments 
    else v_draft.suggested_items 
  end;
  
  -- Create actual quote
  insert into quotes (
    lead_id,
    version,
    status,
    total_amount,
    currency,
    created_by
  ) values (
    v_draft.lead_id,
    v_version,
    'DRAFT',
    v_draft.total_amount,
    v_draft.currency,
    auth.uid()
  )
  returning id into v_quote_id;
  
  -- Create quote items from suggested items
  insert into quote_items (quote_id, day_no, item_type, description, qty, unit_price, meta)
  select 
    v_quote_id,
    (item->>'day_no')::int,
    item->>'item_type',
    item->>'description',
    coalesce((item->>'qty')::int, 1),
    coalesce((item->>'unit_price')::numeric, 0),
    coalesce(item->'meta', '{}'::jsonb)
  from jsonb_array_elements(v_items) as item;
  
  -- Mark draft as approved
  update draft_quotes
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_draft_id;
  
  -- Update lead stage
  update leads
  set stage = 'QUOTED'
  where id = v_draft.lead_id and stage = 'SCOPING';
  
  return v_quote_id;
end;
$$;

comment on function approve_draft_quote is 'Approve AI draft and create actual quote';

-- Grant execute permissions
grant execute on function search_packages to authenticated;
grant execute on function get_package_details to authenticated;
grant execute on function get_products_by_destination to authenticated;
grant execute on function calculate_package_price to authenticated;
grant execute on function create_draft_quote to service_role;
grant execute on function approve_draft_quote to authenticated;
