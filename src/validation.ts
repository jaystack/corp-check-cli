import { getApiEndpoint } from './constants';
import * as request from 'request-promise-native';
import { logger } from './logger';

export const get = async (endpoint): Promise<any> => {
  logger.debug('get', endpoint);
  return await request({
    uri: `${getApiEndpoint()}${endpoint}`,
    json: true
  });
};

export const post = async (endpoint, body): Promise<any> => {
  logger.debug('post', endpoint, JSON.stringify(body, null, 2));
  return await request({
    method: 'POST',
    uri: `${getApiEndpoint()}${endpoint}`,
    json: true,
    body
  });
};

export const getEvaluation = async (cid, logCid = false): Promise<any> => {
  logCid && logger.info('cid -', cid);
  return await request({
    uri: `${getApiEndpoint()}/package?cid=${cid}`,
    json: true
  });
};

export const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));
export const waitToEvaluation = async (cid): Promise<any> => {
  let result: any = await getEvaluation(cid, true);
  logger.debug('waitToEvaluation', JSON.stringify(result, null, 4));
  var lastMessage = '';
  while (result && result.state.type && result.state.type === 'PENDING') {
    if (result.state.message && lastMessage !== result.state.message) {
      logger.info(result.state.message);
      lastMessage = result.state.message;
    }
    await sleep(process.env.WAIT_TO_EVALUATION_INTERVAL || 1500);
    result = await getEvaluation(cid);
    logger.debug('waitToEvaluation', JSON.stringify(result, null, 4));
  }

  return result;
};

export const validate_module = async (name, config = {}) => {
  const validationResult = await post(`/validation`, { packageName: name, ...config });
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};

export const validate_package = async (packageJSON, config = {}) => {
  const validationResult = await post(`/validation`, { packageJSON, ...config });
  logger.debug('validationResult', JSON.stringify(validationResult, null, 4));

  return await waitToEvaluation(validationResult.cid);
};
