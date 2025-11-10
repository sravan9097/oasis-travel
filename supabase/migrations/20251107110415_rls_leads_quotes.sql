-- =====================================================
-- RLS: LEADS, QUOTES
-- =====================================================

-- LEADS: Customers see own; operators see all
create policy "Customers see own leads"
  on leads for select
  using (
    customer_id = auth.uid()
    or is_operator()
  );

create policy "Anyone can create lead (guest mode)"
  on leads for insert
  with check (true); -- Guest session allowed

create policy "Operators can update leads"
  on leads for update
  using (is_operator());

-- REQUEST_DOCS: Follow lead access
create policy "Request docs follow lead access"
  on request_docs for select
  using (
    exists (
      select 1 from leads
      where leads.id = request_docs.lead_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Anyone can create request doc"
  on request_docs for insert
  with check (true);

-- QUOTES: Follow lead access
create policy "Quotes viewable by lead owner and operators"
  on quotes for select
  using (
    exists (
      select 1 from leads
      where leads.id = quotes.lead_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Operators can manage quotes"
  on quotes for all
  using (is_operator());

-- QUOTE_ITEMS: Follow quote access
create policy "Quote items follow quote access"
  on quote_items for select
  using (
    exists (
      select 1 from quotes
      join leads on leads.id = quotes.lead_id
      where quotes.id = quote_items.quote_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Operators can manage quote items"
  on quote_items for all
  using (is_operator());

-- RATE_PLANS: Vendors see own; operators see all
create policy "Rate plans viewable by vendor and operators"
  on rate_plans for select
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
  );

create policy "Vendors can manage own rate plans"
  on rate_plans for all
  using (vendor_id in (select my_vendor_ids()));

