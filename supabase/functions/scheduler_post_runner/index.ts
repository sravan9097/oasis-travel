import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find scheduled posts that are due
    const { data: posts, error: fetchError } = await supabase
      .from('trip_posts')
      .select('*, trip_id')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`Found ${posts?.length || 0} posts to process`);

    for (const post of posts || []) {
      // Get trip members for this trip
      const { data: tripMembers, error: membersError } = await supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', post.trip_id);

      if (membersError) {
        console.error(`Error fetching trip members for post ${post.id}:`, membersError);
        continue;
      }

      // Mark as posted
      await supabase
        .from('trip_posts')
        .update({ status: 'POSTED', posted_at: new Date().toISOString() })
        .eq('id', post.id);

      // Create notifications for trip members
      const notifications = (tripMembers || []).map((member: any) => ({
        user_id: member.user_id,
        kind: 'trip_post',
        title: post.content?.title || 'Trip Update',
        body: post.content?.body || '',
        data_json: { post_id: post.id, trip_id: post.trip_id },
      }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications_outbox')
          .insert(notifications);
      }

      // Audit log
      await supabase
        .from('audit_log')
        .insert({
          action: 'post_trip_update',
          entity: 'trip_posts',
          entity_id: post.id,
          after: { status: 'POSTED' },
        });

      console.log(`Processed post ${post.id}`);
    }

    return new Response(
      JSON.stringify({ processed: posts?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

