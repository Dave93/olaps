export default async function getToken() {
  const response = await fetch(
    `https://les-ailes-co-co.iiko.it/resto/api/auth?login=${Bun.env.LOGIN}&pass=${Bun.env.PASS}`,
    {
      method: "GET",
    }
  );

  const body = response.text();
  return body;
}
