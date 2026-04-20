async function run() {
  const key = "AIzaSyCq9OkPh1cB5eNy0o_p5ewULqax-k9yZrk";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const json = await res.json();
  const valid = json.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")).map(m => m.name);
  console.log("Valid for generateContent:");
  valid.filter(n => !n.includes("embedding") && !n.includes("aqa") && !n.includes("veo") && !n.includes("lyria")).forEach(n => console.log(n));
}
run();
