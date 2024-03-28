import "sst/node/config";
declare module "sst/node/config" {
  export interface ConfigTypes {
    APP: string;
    STAGE: string;
  }
}

import "sst/node/rds";
declare module "sst/node/rds" {
  export interface RDSResources {
    "Database": {
      clusterArn: string;
      secretArn: string;
      defaultDatabaseName: string;
    }
  }
}

import "sst/node/service";
declare module "sst/node/service" {
  export interface ServiceResources {
    "Flowise": {
      url: string;
    }
  }
}

