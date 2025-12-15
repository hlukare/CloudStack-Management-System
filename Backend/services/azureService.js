const { getAzureClients } = require('../config/cloudProviders');
const logger = require('../utils/logger');

// List all virtual machines
const listInstances = async (resourceGroup) => {
  try {
    const { compute } = getAzureClients();
    
    let vms = [];
    if (resourceGroup) {
      const result = await compute.virtualMachines.list(resourceGroup);
      vms = Array.from(result);
    } else {
      const result = await compute.virtualMachines.listAll();
      vms = Array.from(result);
    }
    
    return vms.map(vm => ({
      instanceId: vm.id,
      name: vm.name,
      location: vm.location,
      instanceType: vm.hardwareProfile?.vmSize,
      state: vm.provisioningState,
      tags: vm.tags || {}
    }));
  } catch (error) {
    logger.error('Azure list instances error:', error);
    throw error;
  }
};

// Get instance details
const getInstanceDetails = async (resourceGroup, vmName) => {
  try {
    const { compute } = getAzureClients();
    const vm = await compute.virtualMachines.get(resourceGroup, vmName);
    
    return {
      instanceId: vm.id,
      name: vm.name,
      location: vm.location,
      instanceType: vm.hardwareProfile?.vmSize,
      state: vm.provisioningState,
      osType: vm.storageProfile?.osDisk?.osType,
      tags: vm.tags || {}
    };
  } catch (error) {
    logger.error('Azure get instance details error:', error);
    throw error;
  }
};

// Start instance
const startInstance = async (resourceGroup, vmName) => {
  try {
    const { compute } = getAzureClients();
    await compute.virtualMachines.beginStart(resourceGroup, vmName);
    return { success: true, message: 'VM start initiated' };
  } catch (error) {
    logger.error('Azure start instance error:', error);
    throw error;
  }
};

// Stop instance
const stopInstance = async (resourceGroup, vmName) => {
  try {
    const { compute } = getAzureClients();
    await compute.virtualMachines.beginPowerOff(resourceGroup, vmName);
    return { success: true, message: 'VM stop initiated' };
  } catch (error) {
    logger.error('Azure stop instance error:', error);
    throw error;
  }
};

// Restart instance
const restartInstance = async (resourceGroup, vmName) => {
  try {
    const { compute } = getAzureClients();
    await compute.virtualMachines.beginRestart(resourceGroup, vmName);
    return { success: true, message: 'VM restart initiated' };
  } catch (error) {
    logger.error('Azure restart instance error:', error);
    throw error;
  }
};

// Create snapshot
const createSnapshot = async (resourceGroup, diskName, snapshotName, location) => {
  try {
    const { compute } = getAzureClients();
    
    const snapshot = {
      location: location,
      creationData: {
        createOption: 'Copy',
        sourceResourceId: `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/disks/${diskName}`
      }
    };
    
    const result = await compute.snapshots.beginCreateOrUpdate(
      resourceGroup,
      snapshotName,
      snapshot
    );
    
    return {
      snapshotId: result.id,
      name: result.name,
      status: result.provisioningState
    };
  } catch (error) {
    logger.error('Azure create snapshot error:', error);
    throw error;
  }
};

// List snapshots
const listSnapshots = async (resourceGroup) => {
  try {
    const { compute } = getAzureClients();
    
    let snapshots = [];
    if (resourceGroup) {
      const result = await compute.snapshots.listByResourceGroup(resourceGroup);
      snapshots = Array.from(result);
    } else {
      const result = await compute.snapshots.list();
      snapshots = Array.from(result);
    }
    
    return snapshots.map(snapshot => ({
      snapshotId: snapshot.id,
      name: snapshot.name,
      location: snapshot.location,
      status: snapshot.provisioningState,
      createdTime: snapshot.timeCreated,
      diskSizeGB: snapshot.diskSizeGB
    }));
  } catch (error) {
    logger.error('Azure list snapshots error:', error);
    throw error;
  }
};

// Delete snapshot
const deleteSnapshot = async (resourceGroup, snapshotName) => {
  try {
    const { compute } = getAzureClients();
    await compute.snapshots.beginDelete(resourceGroup, snapshotName);
    return { success: true };
  } catch (error) {
    logger.error('Azure delete snapshot error:', error);
    throw error;
  }
};

// Get metrics
const getInstanceMetrics = async (resourceId, metricName, startTime, endTime) => {
  try {
    const { monitor } = getAzureClients();
    
    const timespan = `${startTime.toISOString()}/${endTime.toISOString()}`;
    
    const metrics = await monitor.metrics.list(
      resourceId,
      {
        timespan: timespan,
        interval: 'PT5M',
        metricnames: metricName,
        aggregation: 'Average'
      }
    );
    
    return metrics.value;
  } catch (error) {
    logger.error('Azure get metrics error:', error);
    throw error;
  }
};

module.exports = {
  listInstances,
  getInstanceDetails,
  startInstance,
  stopInstance,
  restartInstance,
  createSnapshot,
  listSnapshots,
  deleteSnapshot,
  getInstanceMetrics
};
