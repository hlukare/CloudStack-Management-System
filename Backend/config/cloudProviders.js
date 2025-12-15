const { EC2, CloudWatch, CostExplorer, Lambda } = require('@aws-sdk/client-ec2');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { MonitorClient } = require('@azure/arm-monitor');
const { DefaultAzureCredential } = require('@azure/identity');
const { Compute } = require('@google-cloud/compute');

// AWS Configuration
const getAWSClients = (region = process.env.AWS_REGION) => {
  const config = {
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  };

  return {
    ec2: new (require('@aws-sdk/client-ec2').EC2)(config),
    cloudwatch: new (require('@aws-sdk/client-cloudwatch').CloudWatch)(config),
    costExplorer: new (require('@aws-sdk/client-cost-explorer').CostExplorer)(config),
    lambda: new (require('@aws-sdk/client-lambda').Lambda)(config)
  };
};

// Azure Configuration
const getAzureClients = () => {
  const credential = new DefaultAzureCredential();
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

  return {
    compute: new ComputeManagementClient(credential, subscriptionId),
    monitor: new MonitorClient(credential, subscriptionId)
  };
};

// GCP Configuration
const getGCPClients = () => {
  return {
    compute: new Compute({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE
    })
  };
};

module.exports = {
  getAWSClients,
  getAzureClients,
  getGCPClients
};
