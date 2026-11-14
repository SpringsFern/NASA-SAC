
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];

const base =
  process.env.GITHUB_ACTIONS === 'true' &&
  repoName &&
  !repoName.endsWith('.github.io')
    ? `/${repoName}/`
    : '/';

export default {
  base
};
