import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id?: string;
  vendor_id: string;
  name: string;
  category: 'room' | 'package' | 'activity' | 'transfer' | 'meal';
  description?: string;
  base_price: number;
  currency?: string;
  images?: string[];
  availability_json?: Record<string, any>;
  meta?: Record<string, any>;
  destination?: string;
  active?: boolean;
}

interface BulkUploadItem {
  name: string;
  category: string;
  description?: string;
  base_price: number;
  destination?: string;
  meta?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user and get their vendor
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile and vendor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'operator';
    
    // Get user's vendor(s)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', user.id);
    
    const vendorIds = vendors?.map(v => v.id) || [];
    
    if (!isAdmin && vendorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No vendor associated with this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    
    switch (req.method) {
      case 'GET': {
        // List products
        const vendorId = url.searchParams.get('vendor_id');
        const category = url.searchParams.get('category');
        const destination = url.searchParams.get('destination');
        const activeOnly = url.searchParams.get('active') !== 'false';
        
        let query = supabase
          .from('products')
          .select('*, vendors(name, type)');
        
        // Filter by vendor if not admin
        if (!isAdmin) {
          query = query.in('vendor_id', vendorIds);
        } else if (vendorId) {
          query = query.eq('vendor_id', vendorId);
        }
        
        if (category) query = query.eq('category', category);
        if (destination) query = query.ilike('destination', `%${destination}%`);
        if (activeOnly) query = query.eq('active', true);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ products: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'POST': {
        const body = await req.json();
        
        // Handle bulk upload
        if (action === 'bulk') {
          const { vendor_id, items } = body as { vendor_id: string; items: BulkUploadItem[] };
          
          if (!isAdmin && !vendorIds.includes(vendor_id)) {
            return new Response(
              JSON.stringify({ error: 'Not authorized to add products for this vendor' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const productsToInsert = items.map(item => ({
            vendor_id,
            name: item.name,
            category: item.category,
            description: item.description,
            base_price: item.base_price,
            destination: item.destination,
            meta: item.meta,
            active: true,
          }));
          
          const { data, error } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();
          
          if (error) throw error;
          
          return new Response(
            JSON.stringify({ 
              message: `Successfully created ${data.length} products`,
              products: data 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Single product creation
        const product = body as Product;
        
        if (!isAdmin && !vendorIds.includes(product.vendor_id)) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to add products for this vendor' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('products')
          .insert({
            vendor_id: product.vendor_id,
            name: product.name,
            category: product.category,
            description: product.description,
            base_price: product.base_price,
            currency: product.currency || 'INR',
            images: product.images || [],
            availability_json: product.availability_json || {},
            meta: product.meta || {},
            destination: product.destination,
            active: product.active !== false,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ product: data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'PUT': {
        const body = await req.json();
        const productId = url.searchParams.get('id');
        
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'Product ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify ownership
        const { data: existingProduct } = await supabase
          .from('products')
          .select('vendor_id')
          .eq('id', productId)
          .single();
        
        if (!existingProduct) {
          return new Response(
            JSON.stringify({ error: 'Product not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!isAdmin && !vendorIds.includes(existingProduct.vendor_id)) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to update this product' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const updates: Partial<Product> = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.category !== undefined) updates.category = body.category;
        if (body.description !== undefined) updates.description = body.description;
        if (body.base_price !== undefined) updates.base_price = body.base_price;
        if (body.currency !== undefined) updates.currency = body.currency;
        if (body.images !== undefined) updates.images = body.images;
        if (body.availability_json !== undefined) updates.availability_json = body.availability_json;
        if (body.meta !== undefined) updates.meta = body.meta;
        if (body.destination !== undefined) updates.destination = body.destination;
        if (body.active !== undefined) updates.active = body.active;
        
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', productId)
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ product: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'DELETE': {
        const productId = url.searchParams.get('id');
        
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'Product ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify ownership
        const { data: existingProduct } = await supabase
          .from('products')
          .select('vendor_id')
          .eq('id', productId)
          .single();
        
        if (!existingProduct) {
          return new Response(
            JSON.stringify({ error: 'Product not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (!isAdmin && !vendorIds.includes(existingProduct.vendor_id)) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to delete this product' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Soft delete by setting active = false
        const { error } = await supabase
          .from('products')
          .update({ active: false })
          .eq('id', productId);
        
        if (error) throw error;
        
        return new Response(
          JSON.stringify({ message: 'Product deactivated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Vendor Products Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
