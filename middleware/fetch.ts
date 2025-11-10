const BASE_PATH = '/booking';

export default async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  // If input is a string and starts with /, prepend basePath
  const url = typeof input === 'string' && input.startsWith('/') 
    ? `${BASE_PATH}${input}`
    : input;
  
  const res = await fetch(url, init)
  return res.json()
}