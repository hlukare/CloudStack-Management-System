const { getGCPClients } = require('../config/cloudProviders');
const logger = require('../utils/logger');

// List all compute instances
const listInstances = async (zone) => {
  try {
    const { compute } = getGCPClients();
    
    let instances = [];
    if (zone) {
      const [vms] = await compute.getVMs({ filter: `zone eq ${zone}` });
      instances = vms;
    } else {
      const [vms] = await compute.getVMs();
      instances = vms;
    }
    
    return instances.map(instance => ({
      instanceId: instance.id,
      name: instance.name,
      zone: instance.zone.name,
      machineType: instance.metadata.machineType,
      status: instance.metadata.status,
      creationTimestamp: instance.metadata.creationTimestamp
    }));
  } catch (error) {
    logger.error('GCP list instances error:', error);
    throw error;
  }
};

// Get instance details
const getInstanceDetails = async (zone, instanceName) => {
  try {
    const { compute } = getGCPClients();
    const vm = compute.zone(zone).vm(instanceName);
    const [metadata] = await vm.getMetadata();
    
    return {
      instanceId: metadata.id,
      name: metadata.name,
      zone: zone,
      machineType: metadata.machineType,
      status: metadata.status,
      creationTimestamp: metadata.creationTimestamp,
      networkInterfaces: metadata.networkInterfaces,
      disks: metadata.disks
    };
  } catch (error) {
    logger.error('GCP get instance details error:', error);
    throw error;
  }
};

// Start instance
const startInstance = async (zone, instanceName) => {
  try {
    const { compute } = getGCPClients();
    const vm = compute.zone(zone).vm(instanceName);
    await vm.start();
    return { success: true, message: 'VM start initiated' };
  } catch (error) {
    logger.error('GCP start instance error:', error);
    throw error;
  }
};

// Stop instance
const stopInstance = async (zone, instanceName) => {
  try {
    const { compute } = getGCPClients();
    const vm = compute.zone(zone).vm(instanceName);
    await vm.stop();
    return { success: true, message: 'VM stop initiated' };
  } catch (error) {
    logger.error('GCP stop instance error:', error);
    throw error;
  }
};

// Reset instance (reboot)
const resetInstance = async (zone, instanceName) => {
  try {
    const { compute } = getGCPClients();
    const vm = compute.zone(zone).vm(instanceName);
    await vm.reset();
    return { success: true, message: 'VM reset initiated' };
  } catch (error) {
    logger.error('GCP reset instance error:', error);
    throw error;
  }
};

// Create snapshot
const createSnapshot = async (zone, diskName, snapshotName) => {
  try {
    const { compute } = getGCPClients();
    const disk = compute.zone(zone).disk(diskName);
    
    const [snapshot, operation] = await disk.createSnapshot(snapshotName);
    await operation.promise();
    
    return {
      snapshotId: snapshot.id,
      name: snapshot.name,
      status: 'CREATING'
    };
  } catch (error) {
    logger.error('GCP create snapshot error:', error);
    throw error;
  }
};

// List snapshots
const listSnapshots = async () => {
  try {
    const { compute } = getGCPClients();
    const [snapshots] = await compute.getSnapshots();
    
    return snapshots.map(snapshot => ({
      snapshotId: snapshot.id,
      name: snapshot.name,
      creationTimestamp: snapshot.metadata.creationTimestamp,
      diskSizeGb: snapshot.metadata.diskSizeGb,
      status: snapshot.metadata.status
    }));
  } catch (error) {
    logger.error('GCP list snapshots error:', error);
    throw error;
  }
};

// Delete snapshot
const deleteSnapshot = async (snapshotName) => {
  try {
    const { compute } = getGCPClients();
    const snapshot = compute.snapshot(snapshotName);
    await snapshot.delete();
    return { success: true };
  } catch (error) {
    logger.error('GCP delete snapshot error:', error);
    throw error;
  }
};

module.exports = {
  listInstances,
  getInstanceDetails,
  startInstance,
  stopInstance,
  resetInstance,
  createSnapshot,
  listSnapshots,
  deleteSnapshot
};
