
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestBody = await req.json()
    const { action, user_id, email, name, role = 'operations_staff', admin_id, is_active } = requestBody

    // Handle different actions
    if (action === 'list') {
      // List all admin profiles
      const { data: profiles, error } = await supabaseClient
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching admin profiles:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ profiles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'create') {
      // Create a new admin profile (pre-created, waiting for user registration)
      if (!email || !name) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: email, name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('admin_profiles')
        .insert({
          email,
          name,
          role,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating admin profile:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'toggle_status') {
      // Toggle admin status
      if (!admin_id) {
        return new Response(
          JSON.stringify({ error: 'Missing admin_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseClient
        .from('admin_profiles')
        .update({
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating admin status:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default behavior - create/update admin profile on user login
    if (!user_id || !email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, email, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First check if admin profile already exists
    const { data: existingProfile, error: checkError } = await supabaseClient
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing profile:', checkError)
      return new Response(
        JSON.stringify({ error: checkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If profile exists, return it
    if (existingProfile) {
      return new Response(
        JSON.stringify({ data: existingProfile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if there's a pre-created profile for this email (for root admin setup)
    const { data: emailProfile, error: emailError } = await supabaseClient
      .from('admin_profiles')
      .select('*')
      .eq('email', email)
      .is('user_id', null)
      .maybeSingle()

    if (emailError) {
      console.error('Error checking email profile:', emailError)
    }

    let finalData;

    if (emailProfile) {
      // Update the existing email profile with user_id
      const { data, error } = await supabaseClient
        .from('admin_profiles')
        .update({
          user_id,
          name,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailProfile.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating admin profile:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      finalData = data
    } else {
      // Create new admin profile
      const { data, error } = await supabaseClient
        .from('admin_profiles')
        .insert({
          user_id,
          email,
          name,
          role,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating admin profile:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      finalData = data
    }

    return new Response(
      JSON.stringify({ data: finalData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
