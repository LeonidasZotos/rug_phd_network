export const BASE_PATH = "/foa_phd_network";

export function withBasePath(path: `/${string}`): string {
  return `${BASE_PATH}${path}`;
}
