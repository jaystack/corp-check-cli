export const WEBSITEURL = 'http://corp-check.jaystack.com';

export const getApiEndpoint = () => {
  switch (process.env.ENV) {
    case 'dev':
      return 'https://api.corp-check.dev.jaystack.com';
    case 'stage':
      return 'https://api.corp-check.stage.jaystack.com';
    case 'prod':
    default:
      return 'https://api.corp-check.jaystack.com';
  }
};

export const getWebEndpoint = () => {
  switch (process.env.ENV) {
    case 'dev':
      return 'http://corp-check.dev.jaystack.com';
    case 'stage':
      return 'http://corp-check.stage.jaystack.com';
    case 'prod':
    default:
      return 'http://corp-check.jaystack.com';
  }
};
