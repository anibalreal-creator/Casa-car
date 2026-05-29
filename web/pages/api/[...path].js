import { notFoundJson } from '../../lib/server/apiSecurity';

export default function handler(_req, res) {
  return notFoundJson(res);
}
