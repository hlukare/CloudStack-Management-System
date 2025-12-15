require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const VM = require('./models/VM');
const Snapshot = require('./models/Snapshot');
const Alert = require('./models/Alert');
const CostRecord = require('./models/CostRecord');
const AutomationRule = require('./models/AutomationRule');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.DB_NAME,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  seedData();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function seedData() {
  try {
    console.log('🌱 Starting to seed dummy data...');

    // Create a demo user
    let demoUser = await User.findOne({ email: 'demo@cloudstack.com' });
    
    if (!demoUser) {
      demoUser = await User.create({
        username: 'demo_user',
        email: 'demo@cloudstack.com',
        password: 'demo123', // Plain password - model will hash it
        profilePicture: null
      });
      console.log('✅ Created demo user');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    // Create 4 dummy VMs
    const vms = [
      {
        name: 'Production Web Server',
        provider: 'aws',
        region: 'eu-north-1',
        instanceId: 'i-0a1b2c3d4e5f6g7h8',
        instanceType: 't3.medium',
        state: 'running',
        availabilityZone: 'eu-north-1a',
        availabilityZoneId: 'eun1-az1',
        publicIp: '13.48.125.67',
        privateIp: '172.31.24.214',
        publicDnsName: 'ec2-13-48-125-67.eu-north-1.compute.amazonaws.com',
        privateDnsName: 'ip-172-31-24-214.eu-north-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-0a1b2c3d4e5f6g7h8',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-10-15T08:30:00Z'),
        keyName: 'prod-web-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-0a1b2c3d4e5f6g7h8', name: 'web-server-sg' },
          { id: 'sg-9h8g7f6e5d4c3b2a1', name: 'ssh-access-sg' }
        ],
        tags: [
          { key: 'Name', value: 'Production Web Server' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'DevOps' },
          { key: 'Application', value: 'WebApp' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-0a1b2c3d4e5f6g7h8',
            status: 'in-use',
            privateIpAddress: '172.31.24.214',
            publicIp: '13.48.125.67',
            macAddress: '02:a1:b2:c3:d4:e5',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-24-214.eu-north-1.compute.internal',
            groups: [
              { id: 'sg-0a1b2c3d4e5f6g7h8', name: 'web-server-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-0a1b2c3d4e5f6g7h8',
            status: 'attached',
            attachTime: new Date('2025-10-15T08:30:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 45.8,
          memoryUtilization: 62.3,
          diskUtilization: 58.7,
          networkIn: 2048,
          networkOut: 1536,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Database Server MySQL',
        provider: 'aws',
        region: 'eu-north-1',
        instanceId: 'i-9h8g7f6e5d4c3b2a1',
        instanceType: 't3.large',
        state: 'running',
        availabilityZone: 'eu-north-1b',
        availabilityZoneId: 'eun1-az2',
        publicIp: '13.48.142.89',
        privateIp: '172.31.45.128',
        publicDnsName: 'ec2-13-48-142-89.eu-north-1.compute.amazonaws.com',
        privateDnsName: 'ip-172-31-45-128.eu-north-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-9h8g7f6e5d4c3b2a1',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-09-20T10:15:00Z'),
        keyName: 'db-server-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-db1a2b3c4d5e6f7g8', name: 'database-sg' }
        ],
        tags: [
          { key: 'Name', value: 'Database Server MySQL' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Database' },
          { key: 'Database', value: 'MySQL' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-9h8g7f6e5d4c3b2a1',
            status: 'in-use',
            privateIpAddress: '172.31.45.128',
            publicIp: '13.48.142.89',
            macAddress: '02:f6:e5:d4:c3:b2',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-45-128.eu-north-1.compute.internal',
            groups: [
              { id: 'sg-db1a2b3c4d5e6f7g8', name: 'database-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-db1a2b3c4d5e6f7g8',
            status: 'attached',
            attachTime: new Date('2025-09-20T10:15:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 72.5,
          memoryUtilization: 84.2,
          diskUtilization: 65.3,
          networkIn: 3072,
          networkOut: 2048,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Staging Environment',
        provider: 'aws',
        region: 'eu-north-1',
        instanceId: 'i-2b3c4d5e6f7g8h9i0',
        instanceType: 't3.small',
        state: 'stopped',
        availabilityZone: 'eu-north-1a',
        availabilityZoneId: 'eun1-az1',
        publicIp: null,
        privateIp: '172.31.18.95',
        publicDnsName: null,
        privateDnsName: 'ip-172-31-18-95.eu-north-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-0a1b2c3d4e5f6g7h8',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-11-05T14:20:00Z'),
        keyName: 'staging-key',
        monitoring: 'disabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'User initiated (2025-12-10 18:30:00 GMT)',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-stage1a2b3c4d5e6f', name: 'staging-sg' }
        ],
        tags: [
          { key: 'Name', value: 'Staging Environment' },
          { key: 'Environment', value: 'Staging' },
          { key: 'Team', value: 'QA' },
          { key: 'AutoStop', value: 'true' },
          { key: 'CostCenter', value: 'Testing' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-stage1a2b3c4d5e6f',
            status: 'in-use',
            privateIpAddress: '172.31.18.95',
            publicIp: null,
            macAddress: '02:c4:d5:e6:f7:g8',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-18-95.eu-north-1.compute.internal',
            groups: [
              { id: 'sg-stage1a2b3c4d5e6f', name: 'staging-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-stage1a2b3c4d5e6f',
            status: 'attached',
            attachTime: new Date('2025-11-05T14:20:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 0,
          memoryUtilization: 0,
          diskUtilization: 42.1,
          networkIn: 0,
          networkOut: 0,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Development API Server',
        provider: 'aws',
        region: 'eu-north-1',
        instanceId: 'i-dev3c4d5e6f7g8h9i',
        instanceType: 't3.micro',
        state: 'running',
        availabilityZone: 'eu-north-1c',
        availabilityZoneId: 'eun1-az3',
        publicIp: '13.48.98.45',
        privateIp: '172.31.62.187',
        publicDnsName: 'ec2-13-48-98-45.eu-north-1.compute.amazonaws.com',
        privateDnsName: 'ip-172-31-62-187.eu-north-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-dev3c4d5e6f7g8h',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-12-01T09:00:00Z'),
        keyName: 'dev-api-key',
        monitoring: 'disabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-dev1a2b3c4d5e6f7', name: 'dev-api-sg' }
        ],
        tags: [
          { key: 'Name', value: 'Development API Server' },
          { key: 'Environment', value: 'Development' },
          { key: 'Team', value: 'Backend' },
          { key: 'Service', value: 'API' },
          { key: 'CostCenter', value: 'Development' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-dev3c4d5e6f7g8h',
            status: 'in-use',
            privateIpAddress: '172.31.62.187',
            publicIp: '13.48.98.45',
            macAddress: '02:e7:f8:g9:h0:i1',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-62-187.eu-north-1.compute.internal',
            groups: [
              { id: 'sg-dev1a2b3c4d5e6f7', name: 'dev-api-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-dev1a2b3c4d5e6f7',
            status: 'attached',
            attachTime: new Date('2025-12-01T09:00:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 28.3,
          memoryUtilization: 52.7,
          diskUtilization: 38.9,
          networkIn: 1024,
          networkOut: 768,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'AWS Redis Cache Server',
        provider: 'aws',
        region: 'eu-west-1',
        instanceId: 'i-redis8x9y0z1a2b3c',
        instanceType: 'r6g.large',
        state: 'running',
        availabilityZone: 'eu-west-1a',
        availabilityZoneId: 'euw1-az1',
        publicIp: '52.214.78.156',
        privateIp: '172.31.18.92',
        publicDnsName: 'ec2-52-214-78-156.eu-west-1.compute.amazonaws.com',
        privateDnsName: 'ip-172-31-18-92.eu-west-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-redis8x9y0z1a',
        architecture: 'arm64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0d7a109bf30624c99',
        launchTime: new Date('2025-10-05T11:45:00Z'),
        keyName: 'redis-cache-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-redis1a2b3c4d5e6f', name: 'redis-cache-sg' }
        ],
        tags: [
          { key: 'Name', value: 'AWS Redis Cache Server' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Backend' },
          { key: 'Service', value: 'Cache' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-redis8x9y0z1a',
            status: 'in-use',
            privateIpAddress: '172.31.18.92',
            publicIp: '52.214.78.156',
            macAddress: '02:r1:e2:d3:i4:s5',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-18-92.eu-west-1.compute.internal',
            groups: [
              { id: 'sg-redis1a2b3c4d5e6f', name: 'redis-cache-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-redis1a2b3c4d5e6f',
            status: 'attached',
            attachTime: new Date('2025-10-05T11:45:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 62.8,
          memoryUtilization: 78.4,
          diskUtilization: 34.7,
          networkIn: 4096,
          networkOut: 3840,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'AWS Jenkins CI/CD',
        provider: 'aws',
        region: 'us-east-1',
        instanceId: 'i-jenkins5f6g7h8i9j',
        instanceType: 't3.xlarge',
        state: 'running',
        availabilityZone: 'us-east-1b',
        availabilityZoneId: 'use1-az2',
        publicIp: '54.156.92.134',
        privateIp: '172.31.33.47',
        publicDnsName: 'ec2-54-156-92-134.compute-1.amazonaws.com',
        privateDnsName: 'ip-172-31-33-47.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-jenkins5f6g7h',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-08-15T13:20:00Z'),
        keyName: 'jenkins-ci-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-jenkins1a2b3c4d5', name: 'jenkins-sg' },
          { id: 'sg-cicd8x9y0z1a2b3c', name: 'cicd-tools-sg' }
        ],
        tags: [
          { key: 'Name', value: 'AWS Jenkins CI/CD' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'DevOps' },
          { key: 'Service', value: 'CI/CD' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-jenkins5f6g7h',
            status: 'in-use',
            privateIpAddress: '172.31.33.47',
            publicIp: '54.156.92.134',
            macAddress: '02:j1:e2:n3:k4:i5',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-33-47.compute.internal',
            groups: [
              { id: 'sg-jenkins1a2b3c4d5', name: 'jenkins-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-jenkins1a2b3c4d',
            status: 'attached',
            attachTime: new Date('2025-08-15T13:20:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 48.9,
          memoryUtilization: 72.3,
          diskUtilization: 67.8,
          networkIn: 2304,
          networkOut: 1792,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'AWS Monitoring Grafana',
        provider: 'aws',
        region: 'eu-central-1',
        instanceId: 'i-grafana2b3c4d5e6f',
        instanceType: 't3.medium',
        state: 'running',
        availabilityZone: 'eu-central-1a',
        availabilityZoneId: 'euc1-az1',
        publicIp: '18.195.142.87',
        privateIp: '172.31.27.153',
        publicDnsName: 'ec2-18-195-142-87.eu-central-1.compute.amazonaws.com',
        privateDnsName: 'ip-172-31-27-153.eu-central-1.compute.internal',
        vpcId: 'vpc-0a1b2c3d4e5f6g7h8',
        subnetId: 'subnet-grafana2b3c4d',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'hvm',
        rootDeviceType: 'ebs',
        rootDeviceName: '/dev/xvda',
        imageId: 'ami-0c55b159cbfafe1f0',
        launchTime: new Date('2025-09-12T10:30:00Z'),
        keyName: 'monitoring-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '123456789012',
        securityGroups: [
          { id: 'sg-monitoring1a2b3c', name: 'monitoring-sg' }
        ],
        tags: [
          { key: 'Name', value: 'AWS Monitoring Grafana' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'SRE' },
          { key: 'Service', value: 'Monitoring' },
          { key: 'CostCenter', value: 'Operations' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'eni-grafana2b3c4d',
            status: 'in-use',
            privateIpAddress: '172.31.27.153',
            publicIp: '18.195.142.87',
            macAddress: '02:g1:r2:a3:f4:a5',
            sourceDestCheck: true,
            privateDnsName: 'ip-172-31-27-153.eu-central-1.compute.internal',
            groups: [
              { id: 'sg-monitoring1a2b3c', name: 'monitoring-sg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volumeId: 'vol-grafana1a2b3c4d',
            status: 'attached',
            attachTime: new Date('2025-09-12T10:30:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 34.2,
          memoryUtilization: 58.7,
          diskUtilization: 51.3,
          networkIn: 1536,
          networkOut: 1280,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      // Azure VMs
      {
        name: 'Azure Production API',
        provider: 'azure',
        region: 'westeurope',
        instanceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Compute/virtualMachines/prod-api-vm',
        instanceType: 'Standard_D2s_v3',
        state: 'running',
        availabilityZone: 'westeurope-1',
        publicIp: '20.105.45.123',
        privateIp: '10.0.1.10',
        publicDnsName: 'prod-api-vm.westeurope.cloudapp.azure.com',
        privateDnsName: 'prod-api-vm.internal.cloudapp.net',
        vpcId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Network/virtualNetworks/prod-vnet',
        subnetId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Network/virtualNetworks/prod-vnet/subnets/default',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'virtualmachine',
        rootDeviceType: 'managed-disk',
        rootDeviceName: '/dev/sda1',
        imageId: 'Canonical:0001-com-ubuntu-server-focal:20_04-lts:latest',
        launchTime: new Date('2025-09-15T07:00:00Z'),
        keyName: 'azure-prod-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '12345678-1234-1234-1234-123456789abc',
        securityGroups: [
          { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Network/networkSecurityGroups/prod-nsg', name: 'prod-nsg' }
        ],
        tags: [
          { key: 'Name', value: 'Azure Production API' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Platform' },
          { key: 'CostCenter', value: 'Engineering' },
          { key: 'OS', value: 'Ubuntu 20.04' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Network/networkInterfaces/prod-api-nic',
            status: 'in-use',
            privateIpAddress: '10.0.1.10',
            publicIp: '20.105.45.123',
            macAddress: '00:0D:3A:12:34:56',
            sourceDestCheck: false,
            privateDnsName: 'prod-api-vm.internal.cloudapp.net',
            groups: [
              { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Network/networkSecurityGroups/prod-nsg', name: 'prod-nsg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda1',
            volumeId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/production-rg/providers/Microsoft.Compute/disks/prod-api-osdisk',
            status: 'attached',
            attachTime: new Date('2025-09-15T07:00:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 56.4,
          memoryUtilization: 68.9,
          diskUtilization: 52.3,
          networkIn: 2560,
          networkOut: 1920,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Azure Web Frontend',
        provider: 'azure',
        region: 'northeurope',
        instanceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Compute/virtualMachines/web-frontend-vm',
        instanceType: 'Standard_B2ms',
        state: 'running',
        availabilityZone: 'northeurope-1',
        publicIp: '20.54.178.92',
        privateIp: '10.1.2.15',
        publicDnsName: 'web-frontend-vm.northeurope.cloudapp.azure.com',
        privateDnsName: 'web-frontend-vm.internal.cloudapp.net',
        vpcId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Network/virtualNetworks/webapp-vnet',
        subnetId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Network/virtualNetworks/webapp-vnet/subnets/frontend-subnet',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'virtualmachine',
        rootDeviceType: 'managed-disk',
        rootDeviceName: '/dev/sda1',
        imageId: 'Canonical:0001-com-ubuntu-server-jammy:22_04-lts:latest',
        launchTime: new Date('2025-10-20T12:30:00Z'),
        keyName: 'azure-web-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '12345678-1234-1234-1234-123456789abc',
        securityGroups: [
          { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Network/networkSecurityGroups/web-nsg', name: 'web-nsg' }
        ],
        tags: [
          { key: 'Name', value: 'Azure Web Frontend' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Frontend' },
          { key: 'Application', value: 'WebApp' },
          { key: 'OS', value: 'Ubuntu 22.04' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Network/networkInterfaces/web-frontend-nic',
            status: 'in-use',
            privateIpAddress: '10.1.2.15',
            publicIp: '20.54.178.92',
            macAddress: '00:0D:3A:AB:CD:EF',
            sourceDestCheck: false,
            privateDnsName: 'web-frontend-vm.internal.cloudapp.net',
            groups: [
              { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Network/networkSecurityGroups/web-nsg', name: 'web-nsg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda1',
            volumeId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/webapp-rg/providers/Microsoft.Compute/disks/web-frontend-osdisk',
            status: 'attached',
            attachTime: new Date('2025-10-20T12:30:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 38.7,
          memoryUtilization: 55.2,
          diskUtilization: 44.6,
          networkIn: 3584,
          networkOut: 2048,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Azure SQL Database Server',
        provider: 'azure',
        region: 'westeurope',
        instanceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Compute/virtualMachines/sql-db-vm',
        instanceType: 'Standard_E4s_v3',
        state: 'running',
        availabilityZone: 'westeurope-2',
        publicIp: null,
        privateIp: '10.2.0.8',
        publicDnsName: null,
        privateDnsName: 'sql-db-vm.internal.cloudapp.net',
        vpcId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Network/virtualNetworks/db-vnet',
        subnetId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Network/virtualNetworks/db-vnet/subnets/database-subnet',
        architecture: 'x86_64',
        platform: 'windows',
        virtualizationType: 'virtualmachine',
        rootDeviceType: 'managed-disk',
        rootDeviceName: 'C:',
        imageId: 'MicrosoftSQLServer:sql2019-ws2019:sqldev:latest',
        launchTime: new Date('2025-08-10T14:45:00Z'),
        keyName: 'azure-db-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: '12345678-1234-1234-1234-123456789abc',
        securityGroups: [
          { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Network/networkSecurityGroups/db-nsg', name: 'db-nsg' }
        ],
        tags: [
          { key: 'Name', value: 'Azure SQL Database Server' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Database' },
          { key: 'Database', value: 'SQL Server 2019' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Network/networkInterfaces/sql-db-nic',
            status: 'in-use',
            privateIpAddress: '10.2.0.8',
            publicIp: null,
            macAddress: '00:0D:3A:22:33:44',
            sourceDestCheck: false,
            privateDnsName: 'sql-db-vm.internal.cloudapp.net',
            groups: [
              { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Network/networkSecurityGroups/db-nsg', name: 'db-nsg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: 'C:',
            volumeId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/database-rg/providers/Microsoft.Compute/disks/sql-db-osdisk',
            status: 'attached',
            attachTime: new Date('2025-08-10T14:45:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 78.3,
          memoryUtilization: 89.6,
          diskUtilization: 72.1,
          networkIn: 4096,
          networkOut: 3072,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'Azure Dev Test Server',
        provider: 'azure',
        region: 'uksouth',
        instanceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Compute/virtualMachines/dev-test-vm',
        instanceType: 'Standard_B1s',
        state: 'stopped',
        availabilityZone: 'uksouth-1',
        publicIp: '51.142.78.45',
        privateIp: '10.3.1.5',
        publicDnsName: 'dev-test-vm.uksouth.cloudapp.azure.com',
        privateDnsName: 'dev-test-vm.internal.cloudapp.net',
        vpcId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Network/virtualNetworks/dev-vnet',
        subnetId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Network/virtualNetworks/dev-vnet/subnets/test-subnet',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'virtualmachine',
        rootDeviceType: 'managed-disk',
        rootDeviceName: '/dev/sda1',
        imageId: 'Canonical:0001-com-ubuntu-server-focal:20_04-lts:latest',
        launchTime: new Date('2025-11-05T16:20:00Z'),
        keyName: 'azure-dev-key',
        monitoring: 'disabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'User stopped',
        ownerId: '12345678-1234-1234-1234-123456789abc',
        securityGroups: [
          { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Network/networkSecurityGroups/dev-nsg', name: 'dev-nsg' }
        ],
        tags: [
          { key: 'Name', value: 'Azure Dev Test Server' },
          { key: 'Environment', value: 'Development' },
          { key: 'Team', value: 'QA' },
          { key: 'Purpose', value: 'Testing' },
          { key: 'AutoShutdown', value: 'true' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Network/networkInterfaces/dev-test-nic',
            status: 'in-use',
            privateIpAddress: '10.3.1.5',
            publicIp: '51.142.78.45',
            macAddress: '00:0D:3A:55:66:77',
            sourceDestCheck: false,
            privateDnsName: 'dev-test-vm.internal.cloudapp.net',
            groups: [
              { id: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Network/networkSecurityGroups/dev-nsg', name: 'dev-nsg' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda1',
            volumeId: '/subscriptions/12345678-1234-1234-1234-123456789abc/resourceGroups/dev-rg/providers/Microsoft.Compute/disks/dev-test-osdisk',
            status: 'attached',
            attachTime: new Date('2025-11-05T16:20:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 0,
          memoryUtilization: 0,
          diskUtilization: 28.4,
          networkIn: 0,
          networkOut: 0,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      // GCP VMs
      {
        name: 'GCP Production Web',
        provider: 'gcp',
        region: 'europe-west1-b',
        instanceId: 'projects/cloudstack-prod/zones/europe-west1-b/instances/prod-web-vm',
        instanceType: 'n2-standard-2',
        state: 'running',
        availabilityZone: 'europe-west1-b',
        publicIp: '35.205.124.87',
        privateIp: '10.132.0.10',
        publicDnsName: 'prod-web-vm.europe-west1-b.c.cloudstack-prod.internal',
        privateDnsName: 'prod-web-vm.c.cloudstack-prod.internal',
        vpcId: 'projects/cloudstack-prod/global/networks/default',
        subnetId: 'projects/cloudstack-prod/regions/europe-west1/subnetworks/default',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'compute-engine',
        rootDeviceType: 'persistent-disk',
        rootDeviceName: '/dev/sda',
        imageId: 'projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20231101',
        launchTime: new Date('2025-09-25T09:15:00Z'),
        keyName: 'gcp-prod-ssh-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: 'cloudstack-prod',
        securityGroups: [
          { id: 'projects/cloudstack-prod/global/firewalls/allow-http-https', name: 'allow-http-https' },
          { id: 'projects/cloudstack-prod/global/firewalls/allow-ssh', name: 'allow-ssh' }
        ],
        tags: [
          { key: 'Name', value: 'GCP Production Web' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'WebOps' },
          { key: 'Application', value: 'MainWebsite' },
          { key: 'CostCenter', value: 'Marketing' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'nic0',
            status: 'in-use',
            privateIpAddress: '10.132.0.10',
            publicIp: '35.205.124.87',
            macAddress: '42:01:0a:84:00:0a',
            sourceDestCheck: false,
            privateDnsName: 'prod-web-vm.c.cloudstack-prod.internal',
            groups: [
              { id: 'projects/cloudstack-prod/global/firewalls/allow-http-https', name: 'allow-http-https' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda',
            volumeId: 'projects/cloudstack-prod/zones/europe-west1-b/disks/prod-web-vm',
            status: 'attached',
            attachTime: new Date('2025-09-25T09:15:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 42.8,
          memoryUtilization: 58.3,
          diskUtilization: 48.9,
          networkIn: 2816,
          networkOut: 1792,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'GCP Analytics Engine',
        provider: 'gcp',
        region: 'us-central1-a',
        instanceId: 'projects/cloudstack-analytics/zones/us-central1-a/instances/analytics-engine-vm',
        instanceType: 'n2-highmem-4',
        state: 'running',
        availabilityZone: 'us-central1-a',
        publicIp: '34.68.92.156',
        privateIp: '10.128.0.25',
        publicDnsName: 'analytics-engine-vm.us-central1-a.c.cloudstack-analytics.internal',
        privateDnsName: 'analytics-engine-vm.c.cloudstack-analytics.internal',
        vpcId: 'projects/cloudstack-analytics/global/networks/analytics-network',
        subnetId: 'projects/cloudstack-analytics/regions/us-central1/subnetworks/analytics-subnet',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'compute-engine',
        rootDeviceType: 'persistent-disk',
        rootDeviceName: '/dev/sda',
        imageId: 'projects/debian-cloud/global/images/debian-11-bullseye-v20231030',
        launchTime: new Date('2025-10-10T11:30:00Z'),
        keyName: 'gcp-analytics-ssh-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: 'cloudstack-analytics',
        securityGroups: [
          { id: 'projects/cloudstack-analytics/global/firewalls/analytics-internal', name: 'analytics-internal' }
        ],
        tags: [
          { key: 'Name', value: 'GCP Analytics Engine' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'DataScience' },
          { key: 'Workload', value: 'BigData' },
          { key: 'CostCenter', value: 'Analytics' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'nic0',
            status: 'in-use',
            privateIpAddress: '10.128.0.25',
            publicIp: '34.68.92.156',
            macAddress: '42:01:0a:80:00:19',
            sourceDestCheck: false,
            privateDnsName: 'analytics-engine-vm.c.cloudstack-analytics.internal',
            groups: [
              { id: 'projects/cloudstack-analytics/global/firewalls/analytics-internal', name: 'analytics-internal' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda',
            volumeId: 'projects/cloudstack-analytics/zones/us-central1-a/disks/analytics-engine-vm',
            status: 'attached',
            attachTime: new Date('2025-10-10T11:30:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 68.5,
          memoryUtilization: 82.7,
          diskUtilization: 61.4,
          networkIn: 5120,
          networkOut: 3584,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'GCP Kubernetes Node',
        provider: 'gcp',
        region: 'europe-west4-c',
        instanceId: 'projects/cloudstack-k8s/zones/europe-west4-c/instances/gke-cluster-node-1',
        instanceType: 'e2-medium',
        state: 'running',
        availabilityZone: 'europe-west4-c',
        publicIp: '34.90.145.78',
        privateIp: '10.164.0.15',
        publicDnsName: 'gke-cluster-node-1.europe-west4-c.c.cloudstack-k8s.internal',
        privateDnsName: 'gke-cluster-node-1.c.cloudstack-k8s.internal',
        vpcId: 'projects/cloudstack-k8s/global/networks/gke-network',
        subnetId: 'projects/cloudstack-k8s/regions/europe-west4/subnetworks/gke-subnet',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'compute-engine',
        rootDeviceType: 'persistent-disk',
        rootDeviceName: '/dev/sda',
        imageId: 'projects/cos-cloud/global/images/cos-stable-109-17800-147-54',
        launchTime: new Date('2025-11-01T08:00:00Z'),
        keyName: 'gke-cluster-ssh-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'GKE managed',
        ownerId: 'cloudstack-k8s',
        securityGroups: [
          { id: 'projects/cloudstack-k8s/global/firewalls/gke-allow-internal', name: 'gke-allow-internal' }
        ],
        tags: [
          { key: 'Name', value: 'GCP Kubernetes Node' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Platform' },
          { key: 'Cluster', value: 'main-cluster' },
          { key: 'Managed', value: 'GKE' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'nic0',
            status: 'in-use',
            privateIpAddress: '10.164.0.15',
            publicIp: '34.90.145.78',
            macAddress: '42:01:0a:a4:00:0f',
            sourceDestCheck: false,
            privateDnsName: 'gke-cluster-node-1.c.cloudstack-k8s.internal',
            groups: [
              { id: 'projects/cloudstack-k8s/global/firewalls/gke-allow-internal', name: 'gke-allow-internal' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda',
            volumeId: 'projects/cloudstack-k8s/zones/europe-west4-c/disks/gke-cluster-node-1',
            status: 'attached',
            attachTime: new Date('2025-11-01T08:00:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 52.3,
          memoryUtilization: 71.8,
          diskUtilization: 56.7,
          networkIn: 3328,
          networkOut: 2304,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'GCP Development VM',
        provider: 'gcp',
        region: 'asia-south1-a',
        instanceId: 'projects/cloudstack-dev/zones/asia-south1-a/instances/dev-vm-001',
        instanceType: 'e2-small',
        state: 'stopped',
        availabilityZone: 'asia-south1-a',
        publicIp: '34.93.45.123',
        privateIp: '10.160.0.8',
        publicDnsName: 'dev-vm-001.asia-south1-a.c.cloudstack-dev.internal',
        privateDnsName: 'dev-vm-001.c.cloudstack-dev.internal',
        vpcId: 'projects/cloudstack-dev/global/networks/default',
        subnetId: 'projects/cloudstack-dev/regions/asia-south1/subnetworks/default',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'compute-engine',
        rootDeviceType: 'persistent-disk',
        rootDeviceName: '/dev/sda',
        imageId: 'projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20231030',
        launchTime: new Date('2025-11-20T13:45:00Z'),
        keyName: 'gcp-dev-ssh-key',
        monitoring: 'disabled',
        tenancy: 'default',
        ebsOptimized: false,
        enaSupport: true,
        stateTransitionReason: 'User stopped for cost savings',
        ownerId: 'cloudstack-dev',
        securityGroups: [
          { id: 'projects/cloudstack-dev/global/firewalls/default-allow-ssh', name: 'default-allow-ssh' }
        ],
        tags: [
          { key: 'Name', value: 'GCP Development VM' },
          { key: 'Environment', value: 'Development' },
          { key: 'Team', value: 'Engineering' },
          { key: 'Owner', value: 'john.doe' },
          { key: 'AutoShutdown', value: 'enabled' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'nic0',
            status: 'in-use',
            privateIpAddress: '10.160.0.8',
            publicIp: '34.93.45.123',
            macAddress: '42:01:0a:a0:00:08',
            sourceDestCheck: false,
            privateDnsName: 'dev-vm-001.c.cloudstack-dev.internal',
            groups: [
              { id: 'projects/cloudstack-dev/global/firewalls/default-allow-ssh', name: 'default-allow-ssh' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda',
            volumeId: 'projects/cloudstack-dev/zones/asia-south1-a/disks/dev-vm-001',
            status: 'attached',
            attachTime: new Date('2025-11-20T13:45:00Z'),
            deleteOnTermination: true
          }
        ],
        metrics: {
          cpuUtilization: 0,
          memoryUtilization: 0,
          diskUtilization: 32.5,
          networkIn: 0,
          networkOut: 0,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      },
      {
        name: 'GCP PostgreSQL Database',
        provider: 'gcp',
        region: 'europe-north1-a',
        instanceId: 'projects/cloudstack-db/zones/europe-north1-a/instances/postgres-primary-db',
        instanceType: 'n2-highmem-8',
        state: 'running',
        availabilityZone: 'europe-north1-a',
        publicIp: '35.228.47.192',
        privateIp: '10.166.0.12',
        publicDnsName: 'postgres-primary-db.europe-north1-a.c.cloudstack-db.internal',
        privateDnsName: 'postgres-primary-db.c.cloudstack-db.internal',
        vpcId: 'projects/cloudstack-db/global/networks/db-network',
        subnetId: 'projects/cloudstack-db/regions/europe-north1/subnetworks/db-subnet',
        architecture: 'x86_64',
        platform: 'linux',
        virtualizationType: 'compute-engine',
        rootDeviceType: 'persistent-disk',
        rootDeviceName: '/dev/sda',
        imageId: 'projects/debian-cloud/global/images/debian-11-bullseye-v20231101',
        launchTime: new Date('2025-08-28T07:20:00Z'),
        keyName: 'gcp-postgres-ssh-key',
        monitoring: 'enabled',
        tenancy: 'default',
        ebsOptimized: true,
        enaSupport: true,
        stateTransitionReason: 'User initiated',
        ownerId: 'cloudstack-db',
        securityGroups: [
          { id: 'projects/cloudstack-db/global/firewalls/postgres-allow-internal', name: 'postgres-allow-internal' },
          { id: 'projects/cloudstack-db/global/firewalls/allow-postgres-port', name: 'allow-postgres-port' }
        ],
        tags: [
          { key: 'Name', value: 'GCP PostgreSQL Database' },
          { key: 'Environment', value: 'Production' },
          { key: 'Team', value: 'Database' },
          { key: 'Database', value: 'PostgreSQL 15' },
          { key: 'CostCenter', value: 'Engineering' }
        ],
        networkInterfaces: [
          {
            networkInterfaceId: 'nic0',
            status: 'in-use',
            privateIpAddress: '10.166.0.12',
            publicIp: '35.228.47.192',
            macAddress: '42:01:0a:a6:00:0c',
            sourceDestCheck: false,
            privateDnsName: 'postgres-primary-db.c.cloudstack-db.internal',
            groups: [
              { id: 'projects/cloudstack-db/global/firewalls/postgres-allow-internal', name: 'postgres-allow-internal' }
            ]
          }
        ],
        blockDevices: [
          {
            deviceName: '/dev/sda',
            volumeId: 'projects/cloudstack-db/zones/europe-north1-a/disks/postgres-primary-db',
            status: 'attached',
            attachTime: new Date('2025-08-28T07:20:00Z'),
            deleteOnTermination: false
          },
          {
            deviceName: '/dev/sdb',
            volumeId: 'projects/cloudstack-db/zones/europe-north1-a/disks/postgres-data-disk',
            status: 'attached',
            attachTime: new Date('2025-08-28T07:25:00Z'),
            deleteOnTermination: false
          }
        ],
        metrics: {
          cpuUtilization: 81.4,
          memoryUtilization: 88.9,
          diskUtilization: 74.2,
          networkIn: 6144,
          networkOut: 4608,
          lastUpdated: new Date()
        },
        userId: demoUser._id
      }
    ];

    // Clear existing VMs for demo user
    await VM.deleteMany({ userId: demoUser._id });
    console.log('🗑️  Cleared existing VMs');

    // Insert VMs
    const createdVMs = await VM.insertMany(vms);
    console.log(`✅ Created ${createdVMs.length} VMs`);

    // Create snapshots for each VM
    const snapshots = [];
    createdVMs.forEach((vm, index) => {
      // 2-3 snapshots per VM
      const snapshotCount = index % 2 === 0 ? 3 : 2;
      for (let i = 0; i < snapshotCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7)); // Weekly snapshots
        
        snapshots.push({
          vmId: vm._id,
          vmName: vm.name,
          provider: vm.provider,
          instanceId: vm.instanceId,
          region: vm.region,
          snapshotId: `snap-${vm.instanceId.slice(2)}-${i}`,
          volumeId: vm.blockDevices && vm.blockDevices[0] ? vm.blockDevices[0].volumeId : `vol-${vm.instanceId.slice(2)}`,
          name: `Backup ${i + 1} - ${vm.name}`,
          description: `${i === 0 ? 'Latest' : 'Weekly'} backup - ${vm.name}`,
          status: 'completed',
          progress: '100%',
          size: Math.floor(Math.random() * 50) + 10, // 10-60 GB
          volumeSize: Math.floor(Math.random() * 50) + 10,
          startTime: date,
          createdAt: date,
          userId: demoUser._id
        });
      }
    });

    await Snapshot.deleteMany({ userId: demoUser._id });
    await Snapshot.insertMany(snapshots);
    console.log(`✅ Created ${snapshots.length} snapshots`);

    // Create alerts
    const alerts = [
      {
        title: 'High CPU Usage Detected',
        message: 'Database Server MySQL is experiencing high CPU utilization (72.5%)',
        alertType: 'cpu_high',
        severity: 'high',
        status: 'active',
        vmId: createdVMs[1]._id,
        vmName: createdVMs[1].name,
        metadata: {
          metric: 'CPU',
          value: '72.5%',
          threshold: '70%'
        },
        userId: demoUser._id
      },
      {
        title: 'Memory Usage Warning',
        message: 'Database Server MySQL memory utilization is at 84.2%',
        alertType: 'memory_high',
        severity: 'critical',
        status: 'acknowledged',
        vmId: createdVMs[1]._id,
        vmName: createdVMs[1].name,
        metadata: {
          metric: 'Memory',
          value: '84.2%',
          threshold: '80%'
        },
        acknowledgedAt: new Date(),
        userId: demoUser._id
      },
      {
        title: 'VM State Changed',
        message: 'Staging Environment has been stopped',
        alertType: 'instance_stopped',
        severity: 'low',
        status: 'resolved',
        vmId: createdVMs[2]._id,
        vmName: createdVMs[2].name,
        metadata: {
          previousState: 'running',
          currentState: 'stopped'
        },
        resolvedAt: new Date(),
        userId: demoUser._id
      },
      {
        title: 'Disk Usage Moderate',
        message: 'Database Server MySQL disk utilization at 65.3%',
        alertType: 'disk_high',
        severity: 'medium',
        status: 'active',
        vmId: createdVMs[1]._id,
        vmName: createdVMs[1].name,
        metadata: {
          metric: 'Disk',
          value: '65.3%',
          threshold: '60%'
        },
        userId: demoUser._id
      }
    ];

    await Alert.deleteMany({ userId: demoUser._id });
    await Alert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} alerts`);

    // Create cost records for last 30 days
    const costRecords = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const periodStart = new Date(date);
      const periodEnd = new Date(date);
      periodEnd.setHours(23, 59, 59, 999);

      createdVMs.forEach((vm) => {
        let cost = 0;
        if (vm.instanceType === 't3.micro') cost = 0.0104 * 24;
        else if (vm.instanceType === 't3.small') cost = 0.0208 * 24;
        else if (vm.instanceType === 't3.medium') cost = 0.0416 * 24;
        else if (vm.instanceType === 't3.large') cost = 0.0832 * 24;

        // Stopped VMs cost less (storage only)
        if (vm.state === 'stopped' && i < 5) {
          cost = cost * 0.1; // Only storage costs
        }

        costRecords.push({
          vmId: vm._id,
          provider: vm.provider,
          resourceType: 'compute',
          resourceId: vm.instanceId,
          amount: cost,
          currency: 'USD',
          periodStart: periodStart,
          periodEnd: periodEnd,
          usage: {
            hours: 24,
            storageGB: 8
          },
          region: vm.region,
          instanceType: vm.instanceType,
          tags: {
            vmName: vm.name,
            environment: vm.tags.find(t => t.key === 'Environment')?.value || 'Unknown'
          },
          userId: demoUser._id
        });
      });
    }

    await CostRecord.deleteMany({ userId: demoUser._id });
    await CostRecord.insertMany(costRecords);
    console.log(`✅ Created ${costRecords.length} cost records`);

    // Create automation rules
    const automationRules = [
      {
        name: 'Auto-stop Staging at Night',
        description: 'Automatically stop staging environment outside business hours',
        trigger: {
          type: 'schedule',
          schedule: '0 22 * * *', // 10 PM daily
          conditions: {}
        },
        actions: [{
          type: 'stop_instance',
          parameters: {
            reason: 'Scheduled shutdown - Off hours'
          }
        }],
        targets: {
          vmIds: [createdVMs[2]._id],
          tags: [],
          provider: 'aws',
          region: 'eu-north-1'
        },
        enabled: true,
        lastExecuted: new Date(Date.now() - 86400000), // Yesterday
        executionCount: 15,
        lastExecutionStatus: 'success',
        userId: demoUser._id
      },
      {
        name: 'Snapshot All Production VMs',
        description: 'Weekly snapshot of production servers',
        trigger: {
          type: 'schedule',
          schedule: '0 3 * * 0', // 3 AM every Sunday
          conditions: {}
        },
        actions: [{
          type: 'create_snapshot',
          parameters: {
            description: 'Automated weekly backup',
            retention: 7
          }
        }],
        targets: {
          vmIds: [createdVMs[0]._id, createdVMs[1]._id],
          tags: [{ key: 'Environment', value: 'Production' }],
          provider: 'aws',
          region: 'eu-north-1'
        },
        enabled: true,
        executionCount: 8,
        lastExecutionStatus: 'success',
        userId: demoUser._id
      },
      {
        name: 'Alert on High CPU',
        description: 'Send alert when CPU exceeds 80%',
        trigger: {
          type: 'metric_threshold',
          conditions: {
            metric: 'cpuUtilization',
            operator: 'gt',
            value: 80,
            duration: 5
          },
          schedule: ''
        },
        actions: [{
          type: 'send_alert',
          parameters: {
            severity: 'high',
            message: 'CPU utilization exceeded threshold'
          }
        }],
        targets: {
          vmIds: createdVMs.map(vm => vm._id),
          tags: [],
          provider: 'aws',
          region: 'eu-north-1'
        },
        enabled: true,
        executionCount: 3,
        lastExecutionStatus: 'success',
        userId: demoUser._id
      }
    ];

    await AutomationRule.deleteMany({ userId: demoUser._id });
    await AutomationRule.insertMany(automationRules);
    console.log(`✅ Created ${automationRules.length} automation rules`);

    console.log('\n🎉 Dummy data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Demo User: ${demoUser.email}`);
    console.log(`   - Password: demo123`);
    console.log(`   - VMs: ${createdVMs.length} (7 AWS, 4 Azure, 5 GCP)`);
    console.log(`   - Snapshots: ${snapshots.length}`);
    console.log(`   - Alerts: ${alerts.length}`);
    console.log(`   - Cost Records: ${costRecords.length}`);
    console.log(`   - Automation Rules: ${automationRules.length}`);
    console.log('\n✅ You can now login with demo@cloudstack.com / demo123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}
