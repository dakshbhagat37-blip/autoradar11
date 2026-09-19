import { supabase } from "@/lib/supabase/client";

export default async function Home() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*");

  if (error) {
    return (
      <main>
        <h1>Supabase connection failed</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>AutoRadar Connected</h1>
      <p>Leads found: {leads?.length ?? 0}</p>

      {leads?.map((lead) => (
        <div key={lead.id}>
          <h2>{lead.company_name}</h2>
          <p>{lead.website}</p>
        </div>
      ))}
    </main>
  );
}