const { getAWSClients } = require('../config/cloudProviders');
const logger = require('../utils/logger');

// List all EC2 instances
const listInstances = async (region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.describeInstances({});
    
    const instances = [];
    result.Reservations.forEach(reservation => {
      reservation.Instances.forEach(instance => {
        // Extract network interfaces details
        const networkInterfaces = instance.NetworkInterfaces?.map(ni => ({
          networkInterfaceId: ni.NetworkInterfaceId,
          subnetId: ni.SubnetId,
          vpcId: ni.VpcId,
          privateIpAddress: ni.PrivateIpAddress,
          publicIp: ni.Association?.PublicIp,
          privateDnsName: ni.PrivateDnsName,
          status: ni.Status,
          macAddress: ni.MacAddress,
          sourceDestCheck: ni.SourceDestCheck,
          groups: ni.Groups?.map(g => ({ id: g.GroupId, name: g.GroupName })) || []
        })) || [];
        
        // Extract block device mappings
        const blockDevices = instance.BlockDeviceMappings?.map(bdm => ({
          deviceName: bdm.DeviceName,
          volumeId: bdm.Ebs?.VolumeId,
          status: bdm.Ebs?.Status,
          attachTime: bdm.Ebs?.AttachTime,
          deleteOnTermination: bdm.Ebs?.DeleteOnTermination
        })) || [];
        
        // Extract security groups with names
        const securityGroups = instance.SecurityGroups?.map(sg => ({
          id: sg.GroupId,
          name: sg.GroupName
        })) || [];
        
        instances.push({
          instanceId: instance.InstanceId,
          name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || 'Unnamed',
          state: instance.State.Name,
          stateTransitionReason: instance.StateTransitionReason,
          instanceType: instance.InstanceType,
          platform: instance.Platform || 'linux',
          launchTime: instance.LaunchTime,
          
          // Network details
          privateIp: instance.PrivateIpAddress,
          publicIp: instance.PublicIpAddress,
          privateDnsName: instance.PrivateDnsName,
          publicDnsName: instance.PublicDnsName,
          vpcId: instance.VpcId,
          subnetId: instance.SubnetId,
          networkInterfaces,
          
          // Placement and availability
          availabilityZone: instance.Placement?.AvailabilityZone,
          availabilityZoneId: instance.Placement?.AvailabilityZoneId,
          tenancy: instance.Placement?.Tenancy,
          
          // Security
          securityGroups,
          iamInstanceProfile: instance.IamInstanceProfile ? {
            arn: instance.IamInstanceProfile.Arn,
            id: instance.IamInstanceProfile.Id
          } : null,
          keyName: instance.KeyName,
          
          // Storage
          blockDevices,
          volumeIds: instance.BlockDeviceMappings?.map(bdm => bdm.Ebs?.VolumeId).filter(Boolean) || [],
          rootDeviceName: instance.RootDeviceName,
          rootDeviceType: instance.RootDeviceType,
          ebsOptimized: instance.EbsOptimized,
          
          // Monitoring and other details
          monitoring: instance.Monitoring?.State,
          architecture: instance.Architecture,
          virtualizationType: instance.VirtualizationType,
          hibernationOptions: instance.HibernationOptions?.Configured,
          enaSupport: instance.EnaSupport,
          sriovNetSupport: instance.SriovNetSupport,
          
          // Instance metadata
          imageId: instance.ImageId,
          instanceLifecycle: instance.InstanceLifecycle,
          spotInstanceRequestId: instance.SpotInstanceRequestId,
          
          // Owner and reservation
          ownerId: reservation.OwnerId,
          requesterId: reservation.RequesterId,
          reservationId: reservation.ReservationId,
          
          // Capacity reservation
          capacityReservationId: instance.CapacityReservationId,
          capacityReservationSpecification: instance.CapacityReservationSpecification,
          
          // Tags
          tags: instance.Tags || []
        });
      });
    });
    
    return instances;
  } catch (error) {
    logger.error('AWS list instances error:', error);
    throw error;
  }
};

// Get instance details
const getInstanceDetails = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.describeInstances({ InstanceIds: [instanceId] });
    
    if (!result.Reservations || result.Reservations.length === 0) {
      throw new Error('Instance not found');
    }
    
    const instance = result.Reservations[0].Instances[0];
    const reservation = result.Reservations[0];
    
    // Extract network interfaces details
    const networkInterfaces = instance.NetworkInterfaces?.map(ni => ({
      networkInterfaceId: ni.NetworkInterfaceId,
      subnetId: ni.SubnetId,
      vpcId: ni.VpcId,
      privateIpAddress: ni.PrivateIpAddress,
      publicIp: ni.Association?.PublicIp,
      privateDnsName: ni.PrivateDnsName,
      status: ni.Status,
      macAddress: ni.MacAddress,
      sourceDestCheck: ni.SourceDestCheck,
      groups: ni.Groups?.map(g => ({ id: g.GroupId, name: g.GroupName })) || []
    })) || [];
    
    // Extract block device mappings
    const blockDevices = instance.BlockDeviceMappings?.map(bdm => ({
      deviceName: bdm.DeviceName,
      volumeId: bdm.Ebs?.VolumeId,
      status: bdm.Ebs?.Status,
      attachTime: bdm.Ebs?.AttachTime,
      deleteOnTermination: bdm.Ebs?.DeleteOnTermination
    })) || [];
    
    // Extract security groups with names
    const securityGroups = instance.SecurityGroups?.map(sg => ({
      id: sg.GroupId,
      name: sg.GroupName
    })) || [];
    
    return {
      instanceId: instance.InstanceId,
      name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || 'Unnamed',
      state: instance.State.Name,
      stateTransitionReason: instance.StateTransitionReason,
      instanceType: instance.InstanceType,
      platform: instance.Platform || 'linux',
      launchTime: instance.LaunchTime,
      
      // Network details
      privateIp: instance.PrivateIpAddress,
      publicIp: instance.PublicIpAddress,
      privateDnsName: instance.PrivateDnsName,
      publicDnsName: instance.PublicDnsName,
      vpcId: instance.VpcId,
      subnetId: instance.SubnetId,
      networkInterfaces,
      
      // Placement and availability
      availabilityZone: instance.Placement?.AvailabilityZone,
      availabilityZoneId: instance.Placement?.AvailabilityZoneId,
      tenancy: instance.Placement?.Tenancy,
      
      // Security
      securityGroups,
      iamInstanceProfile: instance.IamInstanceProfile ? {
        arn: instance.IamInstanceProfile.Arn,
        id: instance.IamInstanceProfile.Id
      } : null,
      keyName: instance.KeyName,
      
      // Storage
      blockDevices,
      volumeIds: instance.BlockDeviceMappings?.map(bdm => bdm.Ebs?.VolumeId).filter(Boolean) || [],
      rootDeviceName: instance.RootDeviceName,
      rootDeviceType: instance.RootDeviceType,
      ebsOptimized: instance.EbsOptimized,
      
      // Monitoring and other details
      monitoring: instance.Monitoring?.State,
      architecture: instance.Architecture,
      virtualizationType: instance.VirtualizationType,
      hibernationOptions: instance.HibernationOptions?.Configured,
      enaSupport: instance.EnaSupport,
      sriovNetSupport: instance.SriovNetSupport,
      
      // Instance metadata
      imageId: instance.ImageId,
      instanceLifecycle: instance.InstanceLifecycle,
      spotInstanceRequestId: instance.SpotInstanceRequestId,
      
      // Owner and reservation
      ownerId: reservation.OwnerId,
      requesterId: reservation.RequesterId,
      reservationId: reservation.ReservationId,
      
      // Capacity reservation
      capacityReservationId: instance.CapacityReservationId,
      capacityReservationSpecification: instance.CapacityReservationSpecification,
      
      // Tags
      tags: instance.Tags || []
    };
  } catch (error) {
    logger.error('AWS get instance details error:', error);
    throw error;
  }
};

// Start instance
const startInstance = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.startInstances({ InstanceIds: [instanceId] });
    return result.StartingInstances[0];
  } catch (error) {
    logger.error('AWS start instance error:', error);
    throw error;
  }
};

// Stop instance
const stopInstance = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.stopInstances({ InstanceIds: [instanceId] });
    return result.StoppingInstances[0];
  } catch (error) {
    logger.error('AWS stop instance error:', error);
    throw error;
  }
};

// Reboot instance
const rebootInstance = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    await ec2.rebootInstances({ InstanceIds: [instanceId] });
    return { success: true };
  } catch (error) {
    logger.error('AWS reboot instance error:', error);
    throw error;
  }
};

// Terminate instance
const terminateInstance = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.terminateInstances({ InstanceIds: [instanceId] });
    return result.TerminatingInstances[0];
  } catch (error) {
    logger.error('AWS terminate instance error:', error);
    throw error;
  }
};

// Create snapshot
const createSnapshot = async (volumeId, instanceId, region, description) => {
  try {
    const { ec2 } = getAWSClients(region);
    const result = await ec2.createSnapshot({
      VolumeId: volumeId,
      Description: description || `Snapshot for volume ${volumeId}`,
      TagSpecifications: [{
        ResourceType: 'snapshot',
        Tags: [
          { Key: 'InstanceId', Value: instanceId },
          { Key: 'VolumeId', Value: volumeId },
          { Key: 'CreatedBy', Value: 'CloudVMManagement' }
        ]
      }]
    });
    
    // Get volume details for size
    const volumeDetails = await ec2.describeVolumes({ VolumeIds: [volumeId] });
    const volume = volumeDetails.Volumes[0];
    
    return {
      snapshotId: result.SnapshotId,
      volumeId: result.VolumeId,
      status: result.State,
      startTime: result.StartTime,
      progress: result.Progress || '0%',
      volumeSize: volume?.Size || 0,
      size: volume?.Size || 0, // Initial size same as volume
      description: result.Description,
      encryption: {
        enabled: result.Encrypted || false,
        keyId: result.KmsKeyId || null
      },
      ownerId: result.OwnerId,
      outpostArn: result.OutpostArn || null,
      storageTier: result.StorageTier || 'standard',
      tags: result.Tags || []
    };
  } catch (error) {
    logger.error('AWS create snapshot error:', error);
    throw error;
  }
};

// Create snapshots for all volumes
const createInstanceSnapshots = async (instanceId, region) => {
  try {
    const instance = await getInstanceDetails(instanceId, region);
    const snapshots = [];
    
    for (const volumeId of instance.volumeIds) {
      const snapshot = await createSnapshot(
        volumeId,
        instanceId,
        region,
        `Automated snapshot for ${instance.name || instanceId}`
      );
      snapshots.push(snapshot);
    }
    
    return snapshots;
  } catch (error) {
    logger.error('AWS create instance snapshots error:', error);
    throw error;
  }
};

// List snapshots
const listSnapshots = async (instanceId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    const filters = instanceId 
      ? [{ Name: 'tag:InstanceId', Values: [instanceId] }]
      : [];
    
    const result = await ec2.describeSnapshots({
      OwnerIds: ['self'],
      Filters: filters
    });
    
    return result.Snapshots.map(snapshot => ({
      snapshotId: snapshot.SnapshotId,
      volumeId: snapshot.VolumeId,
      status: snapshot.State,
      progress: snapshot.Progress,
      startTime: snapshot.StartTime,
      description: snapshot.Description,
      volumeSize: snapshot.VolumeSize,
      encrypted: snapshot.Encrypted,
      tags: snapshot.Tags || []
    }));
  } catch (error) {
    logger.error('AWS list snapshots error:', error);
    throw error;
  }
};

// Delete snapshot
const deleteSnapshot = async (snapshotId, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    await ec2.deleteSnapshot({ SnapshotId: snapshotId });
    return { success: true };
  } catch (error) {
    logger.error('AWS delete snapshot error:', error);
    throw error;
  }
};

// Get CloudWatch metrics
const getInstanceMetrics = async (instanceId, region, metricName, startTime, endTime) => {
  try {
    const { cloudwatch } = getAWSClients(region);
    
    const params = {
      Namespace: 'AWS/EC2',
      MetricName: metricName,
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Average', 'Maximum']
    };
    
    const result = await cloudwatch.getMetricStatistics(params);
    return result.Datapoints.sort((a, b) => a.Timestamp - b.Timestamp);
  } catch (error) {
    logger.error('AWS get instance metrics error:', error);
    throw error;
  }
};

// Get comprehensive metrics
const getComprehensiveMetrics = async (instanceId, region) => {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Last 1 hour
    
    const [cpuData, networkInData, networkOutData, diskReadData, diskWriteData] = await Promise.all([
      getInstanceMetrics(instanceId, region, 'CPUUtilization', startTime, endTime),
      getInstanceMetrics(instanceId, region, 'NetworkIn', startTime, endTime),
      getInstanceMetrics(instanceId, region, 'NetworkOut', startTime, endTime),
      getInstanceMetrics(instanceId, region, 'DiskReadBytes', startTime, endTime),
      getInstanceMetrics(instanceId, region, 'DiskWriteBytes', startTime, endTime)
    ]);
    
    return {
      cpu: cpuData,
      networkIn: networkInData,
      networkOut: networkOutData,
      diskRead: diskReadData,
      diskWrite: diskWriteData
    };
  } catch (error) {
    logger.error('AWS get comprehensive metrics error:', error);
    throw error;
  }
};

// Get cost data
const getCostData = async (startDate, endDate) => {
  try {
    const { costExplorer } = getAWSClients();
    
    const params = {
      TimePeriod: {
        Start: startDate,
        End: endDate
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };
    
    const result = await costExplorer.getCostAndUsage(params);
    return result.ResultsByTime;
  } catch (error) {
    logger.error('AWS get cost data error:', error);
    throw error;
  }
};

// Modify instance type (resize)
const modifyInstanceType = async (instanceId, newInstanceType, region) => {
  try {
    const { ec2 } = getAWSClients(region);
    
    // Stop instance first
    await stopInstance(instanceId, region);
    
    // Wait for instance to stop
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    // Modify instance type
    await ec2.modifyInstanceAttribute({
      InstanceId: instanceId,
      InstanceType: {
        Value: newInstanceType
      }
    });
    
    // Start instance
    await startInstance(instanceId, region);
    
    return { success: true, newInstanceType };
  } catch (error) {
    logger.error('AWS modify instance type error:', error);
    throw error;
  }
};

module.exports = {
  listInstances,
  getInstanceDetails,
  startInstance,
  stopInstance,
  rebootInstance,
  terminateInstance,
  createSnapshot,
  createInstanceSnapshots,
  listSnapshots,
  deleteSnapshot,
  getInstanceMetrics,
  getComprehensiveMetrics,
  getCostData,
  modifyInstanceType
};
