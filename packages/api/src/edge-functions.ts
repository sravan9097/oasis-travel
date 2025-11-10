import { getSupabase } from './client';

/**
 * Edge Function: Generate PDF for quote
 * 
 * @param quoteId - The quote ID to generate PDF for
 * @returns Promise that resolves when PDF is generated
 */
export const generateQuotePDF = async (quoteId: string): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('pdf_generate_quote', {
    body: { quote_id: quoteId },
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger scheduler post runner (usually called by cron)
 * 
 * @returns Promise that resolves when scheduler runs
 */
export const triggerSchedulerPostRunner = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('scheduler_post_runner', {
    body: {},
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger SLA monitor (usually called by cron)
 * 
 * @returns Promise that resolves when SLA monitor runs
 */
export const triggerSLAMonitor = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('sla_monitor', {
    body: {},
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger recap generator (usually called by cron)
 * 
 * @returns Promise that resolves when recap generator runs
 */
export const triggerRecapGenerator = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('recap_generator', {
    body: {},
  });

  if (error) throw error;
};

