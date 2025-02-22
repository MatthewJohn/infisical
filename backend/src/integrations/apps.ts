import * as Sentry from "@sentry/node";
import { Octokit } from "@octokit/rest";
import { IIntegrationAuth } from "../models";
import request from '../config/request';
import {
  INTEGRATION_AZURE_KEY_VAULT,
  INTEGRATION_AWS_PARAMETER_STORE,
  INTEGRATION_AWS_SECRET_MANAGER,
  INTEGRATION_HEROKU,
  INTEGRATION_VERCEL,
  INTEGRATION_NETLIFY,
  INTEGRATION_GITHUB,
  INTEGRATION_RENDER,
  INTEGRATION_FLYIO,
  INTEGRATION_CIRCLECI,
  INTEGRATION_TRAVISCI,
  INTEGRATION_HEROKU_API_URL,
  INTEGRATION_VERCEL_API_URL,
  INTEGRATION_NETLIFY_API_URL,
  INTEGRATION_RENDER_API_URL,
  INTEGRATION_FLYIO_API_URL,
  INTEGRATION_CIRCLECI_API_URL,
  INTEGRATION_TRAVISCI_API_URL,
} from "../variables";

/**
 * Return list of names of apps for integration named [integration]
 * @param {Object} obj
 * @param {String} obj.integration - name of integration
 * @param {String} obj.accessToken - access token for integration
 * @returns {Object[]} apps - names of integration apps
 * @returns {String} apps.name - name of integration app
 */
const getApps = async ({
  integrationAuth,
  accessToken,
}: {
  integrationAuth: IIntegrationAuth;
  accessToken: string;
}) => {
  interface App {
    name: string;
    appId?: string;
    owner?: string;
  }

  let apps: App[] = [];
  try {
    switch (integrationAuth.integration) {
      case INTEGRATION_AZURE_KEY_VAULT:
        apps = [];
        break;
      case INTEGRATION_AWS_PARAMETER_STORE:
        apps = [];
        break;
      case INTEGRATION_AWS_SECRET_MANAGER:
        apps = [];
        break;
      case INTEGRATION_HEROKU:
        apps = await getAppsHeroku({
          accessToken,
        });
        break;
      case INTEGRATION_VERCEL:
        apps = await getAppsVercel({
          integrationAuth,
          accessToken,
        });
        break;
      case INTEGRATION_NETLIFY:
        apps = await getAppsNetlify({
          accessToken,
        });
        break;
      case INTEGRATION_GITHUB:
        apps = await getAppsGithub({
          accessToken,
        });
        break;
      case INTEGRATION_RENDER:
        apps = await getAppsRender({
          accessToken,
        });
        break;
      case INTEGRATION_FLYIO:
        apps = await getAppsFlyio({
          accessToken,
        });
        break;
      case INTEGRATION_CIRCLECI:
        apps = await getAppsCircleCI({
          accessToken,
        });
        break;
      case INTEGRATION_TRAVISCI:
        apps = await getAppsTravisCI({
          accessToken,
        })
        break;
    }
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get integration apps");
  }

  return apps;
};

/**
 * Return list of apps for Heroku integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Heroku API
 * @returns {Object[]} apps - names of Heroku apps
 * @returns {String} apps.name - name of Heroku app
 */
const getAppsHeroku = async ({ accessToken }: { accessToken: string }) => {
  let apps;
  try {
    const res = (
      await request.get(`${INTEGRATION_HEROKU_API_URL}/apps`, {
        headers: {
          Accept: "application/vnd.heroku+json; version=3",
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data;

    apps = res.map((a: any) => ({
      name: a.name,
    }));
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Heroku integration apps");
  }

  return apps;
};

/**
 * Return list of names of apps for Vercel integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Vercel API
 * @returns {Object[]} apps - names of Vercel apps
 * @returns {String} apps.name - name of Vercel app
 */
const getAppsVercel = async ({
  integrationAuth,
  accessToken,
}: {
  integrationAuth: IIntegrationAuth;
  accessToken: string;
}) => {
  let apps;
  try {
    const res = (
      await request.get(`${INTEGRATION_VERCEL_API_URL}/v9/projects`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept-Encoding': 'application/json'
        },
        ...(integrationAuth?.teamId
          ? {
              params: {
                teamId: integrationAuth.teamId,
              },
            }
          : {}),
      })
    ).data;

    apps = res.projects.map((a: any) => ({
      name: a.name,
    }));
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Vercel integration apps");
  }

  return apps;
};

/**
 * Return list of sites for Netlify integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Netlify API
 * @returns {Object[]} apps - names of Netlify sites
 * @returns {String} apps.name - name of Netlify site
 */
const getAppsNetlify = async ({ accessToken }: { accessToken: string }) => {
  let apps;
  try {
    const res = (
      await request.get(`${INTEGRATION_NETLIFY_API_URL}/api/v1/sites`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept-Encoding': 'application/json'
        }
      })
    ).data;

    apps = res.map((a: any) => ({
      name: a.name,
      appId: a.site_id,
    }));
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Netlify integration apps");
  }

  return apps;
};

/**
 * Return list of repositories for Github integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Netlify API
 * @returns {Object[]} apps - names of Netlify sites
 * @returns {String} apps.name - name of Netlify site
 */
const getAppsGithub = async ({ accessToken }: { accessToken: string }) => {
  let apps;
  try {
    const octokit = new Octokit({
      auth: accessToken,
    });

    const repos = (
      await octokit.request(
        "GET /user/repos{?visibility,affiliation,type,sort,direction,per_page,page,since,before}",
        {
          per_page: 100,
        }
      )
    ).data;

    apps = repos
      .filter((a: any) => a.permissions.admin === true)
      .map((a: any) => ({
        name: a.name,
        owner: a.owner.login,
      }));
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Github repos");
  }

  return apps;
};

/**
 * Return list of services for Render integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Render API
 * @returns {Object[]} apps - names and ids of Render services
 * @returns {String} apps.name - name of Render service
 * @returns {String} apps.appId - id of Render service
 */
const getAppsRender = async ({ accessToken }: { accessToken: string }) => {
  let apps: any;
  try {
    const res = (
      await request.get(`${INTEGRATION_RENDER_API_URL}/v1/services`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Accept-Encoding': 'application/json',
        },
      })
    ).data;
    
    apps = res
      .map((a: any) => ({
        name: a.service.name,
        appId: a.service.id
      })); 
    
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Render services");
  }

  return apps;
};

/**
 * Return list of apps for Fly.io integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for Fly.io API
 * @returns {Object[]} apps - names and ids of Fly.io apps
 * @returns {String} apps.name - name of Fly.io apps
 */
const getAppsFlyio = async ({ accessToken }: { accessToken: string }) => {
  let apps;
  try {
    const query = `
      query($role: String) {
        apps(type: "container", first: 400, role: $role) {
          nodes {
            id
            name
            hostname
          }
        }
      }
    `;

    const res = (await request.post(INTEGRATION_FLYIO_API_URL, {
      query,
      variables: {
        role: null,
      },
    }, {
      headers: {
        Authorization: "Bearer " + accessToken,
        'Accept': 'application/json',
        'Accept-Encoding': 'application/json',
      },
    })).data.data.apps.nodes;

    apps = res.map((a: any) => ({
      name: a.name,
    }));
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get Fly.io apps");
  }

  return apps;
};

/**
 * Return list of projects for CircleCI integration
 * @param {Object} obj
 * @param {String} obj.accessToken - access token for CircleCI API
 * @returns {Object[]} apps -
 * @returns {String} apps.name - name of CircleCI apps
 */
const getAppsCircleCI = async ({ accessToken }: { accessToken: string }) => {
  let apps: any;
  try {    
    const res = (
      await request.get(
        `${INTEGRATION_CIRCLECI_API_URL}/v1.1/projects`,
        {
          headers: {
            "Circle-Token": accessToken,
            "Accept-Encoding": "application/json",
          },
        }
      )
    ).data

    apps = res?.map((a: any) => {
      return {
        name: a?.reponame
      }
    });
  } catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get CircleCI projects");
  }
  
  return apps;
};

const getAppsTravisCI = async ({ accessToken }: { accessToken: string }) => {
  let apps: any;
  try {
    const res = (
      await request.get(
        `${INTEGRATION_TRAVISCI_API_URL}/repos`,
        {
          headers: {
            "Authorization": `token ${accessToken}`,
            "Accept-Encoding": "application/json",
          },
        }
      )
    ).data;

    apps = res?.map((a: any) => {
      return {
        name: a?.slug?.split("/")[1],
        appId: a?.id,
      }
    });
  }catch (err) {
    Sentry.setUser(null);
    Sentry.captureException(err);
    throw new Error("Failed to get TravisCI projects");
  }
  
  return apps;
}

export { getApps };
