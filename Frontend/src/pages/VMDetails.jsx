import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vmAPI } from '../api/api';
import { 
  Server, ArrowLeft, RefreshCw, Play, Square, RotateCw,
  Network, Shield, HardDrive, Info, Activity, Clock,
  Database, Cpu, Tag as TagIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VMDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vm, setVM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchVMDetails();
  }, [id]);

  const fetchVMDetails = async () => {
    try {
      const response = await vmAPI.get(id);
      setVM(response.data);
    } catch (error) {
      toast.error('Failed to fetch VM details');
      navigate('/vms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await vmAPI.refresh(id);
      await fetchVMDetails();
      toast.success('VM details refreshed');
    } catch (error) {
      toast.error('Failed to refresh VM');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await vmAPI[action](id);
      toast.success(`VM ${action} initiated`);
      setTimeout(fetchVMDetails, 2000);
    } catch (error) {
      toast.error(`Failed to ${action} VM`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vm) {
    return <div>VM not found</div>;
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'networking', label: 'Networking', icon: Network },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'tags', label: 'Tags', icon: TagIcon }
  ];

  const getStateColor = (state) => {
    const colors = {
      running: 'bg-gray-200 text-gray-900',
      stopped: 'bg-gray-100 text-gray-700',
      pending: 'bg-gray-200 text-gray-800',
      stopping: 'bg-gray-100 text-gray-700',
      terminated: 'bg-gray-100 text-gray-800'
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vms')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Server className="w-8 h-8" />
              {vm.name}
            </h1>
            <p className="text-gray-600 mt-1 font-mono text-sm">{vm.instanceId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {vm.state === 'stopped' && (
            <button
              onClick={() => handleAction('start')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )}
          {vm.state === 'running' && (
            <>
              <button
                onClick={() => handleAction('reboot')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Reboot
              </button>
              <button
                onClick={() => handleAction('stop')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-600">Instance State</p>
            <span className={`inline-block mt-1 px-3 py-1 text-sm font-semibold rounded-full ${getStateColor(vm.state)}`}>
              {vm.state}
            </span>
          </div>
          <div className="border-l pl-6">
            <p className="text-sm text-gray-600">Instance Type</p>
            <p className="text-sm font-semibold mt-1">{vm.instanceType || 'N/A'}</p>
          </div>
          <div className="border-l pl-6">
            <p className="text-sm text-gray-600">Provider</p>
            <p className="text-sm font-semibold mt-1">{vm.provider?.toUpperCase()}</p>
          </div>
          <div className="border-l pl-6">
            <p className="text-sm text-gray-600">Region</p>
            <p className="text-sm font-semibold mt-1">{vm.region}</p>
          </div>
          {vm.launchTime && (
            <div className="border-l pl-6">
              <p className="text-sm text-gray-600">Launch Time</p>
              <p className="text-sm font-semibold mt-1">{new Date(vm.launchTime).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-200 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'details' && <DetailsTab vm={vm} />}
          {activeTab === 'networking' && <NetworkingTab vm={vm} />}
          {activeTab === 'security' && <SecurityTab vm={vm} />}
          {activeTab === 'storage' && <StorageTab vm={vm} />}
          {activeTab === 'monitoring' && <MonitoringTab vm={vm} />}
          {activeTab === 'tags' && <TagsTab vm={vm} />}
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ vm }) {
  const DetailRow = ({ label, value, mono = false }) => (
    <div className="border-b border-gray-100 py-3 grid grid-cols-3 gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className={`col-span-2 text-sm ${mono ? 'font-mono' : ''} text-gray-900`}>
        {value || '–'}
      </dd>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Instance Details</h3>
        <dl className="bg-gray-50 rounded-lg p-4">
          <DetailRow label="Instance ID" value={vm.instanceId} mono />
          <DetailRow label="Instance Type" value={vm.instanceType} />
          <DetailRow label="Instance State" value={vm.state} />
          <DetailRow label="State Transition Reason" value={vm.stateTransitionReason} />
          <DetailRow label="Platform" value={vm.platform} />
          <DetailRow label="Architecture" value={vm.architecture} />
          <DetailRow label="Virtualization Type" value={vm.virtualizationType} />
          <DetailRow label="Root Device Type" value={vm.rootDeviceType} />
          <DetailRow label="Root Device Name" value={vm.rootDeviceName} />
          <DetailRow label="EBS Optimized" value={vm.ebsOptimized ? 'Yes' : 'No'} />
          <DetailRow label="ENA Support" value={vm.enaSupport ? 'Yes' : 'No'} />
          <DetailRow label="Monitoring" value={vm.monitoring} />
        </dl>
      </div>

      {/* AWS-specific fields */}
      {vm.provider === 'aws' && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-4">AWS Instance Configuration</h3>
            <dl className="bg-gray-50 rounded-lg p-4">
              <DetailRow label="Instance ARN" value={`arn:aws:ec2:${vm.region}:${vm.ownerId}:instance/${vm.instanceId}`} mono />
              <DetailRow label="Auto-assigned IP Address" value={vm.publicIp ? `${vm.publicIp} [Public IP]` : '–'} />
              <DetailRow label="IMDSv2" value="Required" />
              <DetailRow label="Operator" value="–" />
              <DetailRow label="Managed" value="false" />
              <DetailRow label="AWS Compute Optimizer" value="Opt-in for recommendations" />
              <DetailRow label="Auto Scaling Group name" value="–" />
            </dl>
          </div>
        </>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Placement</h3>
        <dl className="bg-gray-50 rounded-lg p-4">
          <DetailRow label="Availability Zone" value={vm.availabilityZone} />
          <DetailRow label="Availability Zone ID" value={vm.availabilityZoneId} />
          <DetailRow label="Tenancy" value={vm.tenancy} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Instance Metadata</h3>
        <dl className="bg-gray-50 rounded-lg p-4">
          <DetailRow label="AMI ID" value={vm.imageId} mono />
          <DetailRow label="Instance Lifecycle" value={vm.instanceLifecycle} />
          <DetailRow label="Spot Instance Request ID" value={vm.spotInstanceRequestId} mono />
          <DetailRow label="Launch Time" value={vm.launchTime ? new Date(vm.launchTime).toLocaleString() : null} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Ownership</h3>
        <dl className="bg-gray-50 rounded-lg p-4">
          <DetailRow label="Owner ID" value={vm.ownerId} mono />
          <DetailRow label="Requester ID" value={vm.requesterId} mono />
          <DetailRow label="Reservation ID" value={vm.reservationId} mono />
        </dl>
      </div>
    </div>
  );
}

function NetworkingTab({ vm }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">VPC and Subnet</h3>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">VPC ID</p>
            <p className="font-mono text-sm mt-1">{vm.vpcId || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subnet ID</p>
            <p className="font-mono text-sm mt-1">{vm.subnetId || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Availability Zone</p>
            <p className="text-sm mt-1">{vm.availabilityZone || '–'}</p>
          </div>
          {vm.availabilityZoneId && (
            <div>
              <p className="text-sm text-gray-600">Availability Zone ID</p>
              <p className="font-mono text-sm mt-1">{vm.availabilityZoneId}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Outpost ID</p>
            <p className="text-sm mt-1">–</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">IP Addresses</h3>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Public IPv4 Address</p>
            <p className="font-mono text-sm mt-1">{vm.publicIp || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Private IPv4 Address</p>
            <p className="font-mono text-sm mt-1">{vm.privateIp || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Secondary private IPv4 addresses</p>
            <p className="text-sm mt-1">–</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Carrier IP addresses (ephemeral)</p>
            <p className="text-sm mt-1">–</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">IPv6 addresses</p>
            <p className="text-sm mt-1">–</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Hostname and DNS</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm text-gray-600">Public DNS</p>
            <p className="font-mono text-sm mt-1 break-all">{vm.publicDnsName || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Private DNS Name (IPv4 only)</p>
            <p className="font-mono text-sm mt-1 break-all">{vm.privateDnsName || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Private hostname type</p>
            <p className="text-sm mt-1">IP name: {vm.privateDnsName?.split('.')[0] || 'ip-172-31-24-214'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">IPv6-only - IP based name: AAAA record only</p>
            <p className="text-sm mt-1">–</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Public hostname type</p>
            <p className="text-sm mt-1">public-ipv4-dns-name</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dualstack - IP based name: A and AAAA record</p>
            <p className="text-sm mt-1">–</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Use RBN as guest OS hostname</p>
            <p className="text-sm mt-1">Disabled</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Answer RBN DNS hostname IPv6</p>
            <p className="text-sm mt-1">–</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Answer RBN DNS hostname IPv4</p>
            <p className="text-sm mt-1">Enabled</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Answer private resource DNS name</p>
            <p className="text-sm mt-1">IPv4 (A)</p>
          </div>
        </div>
      </div>

      {vm.networkInterfaces && vm.networkInterfaces.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Network Interfaces ({vm.networkInterfaces.length})</h3>
          <div className="space-y-3">
            {vm.networkInterfaces.map((ni, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Network Interface ID</p>
                    <p className="font-mono text-sm mt-1">{ni.networkInterfaceId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${
                      ni.status === 'in-use' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ni.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Private IP Address</p>
                    <p className="font-mono text-sm mt-1">{ni.privateIpAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Public IP</p>
                    <p className="font-mono text-sm mt-1">{ni.publicIp || '–'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MAC Address</p>
                    <p className="font-mono text-sm mt-1">{ni.macAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Source/Dest Check</p>
                    <p className="text-sm mt-1">{ni.sourceDestCheck ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Private DNS Name</p>
                    <p className="font-mono text-sm mt-1 break-all">{ni.privateDnsName || '–'}</p>
                  </div>
                  {ni.groups && ni.groups.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Security Groups</p>
                      <div className="flex flex-wrap gap-2">
                        {ni.groups.map((sg, sgIndex) => (
                          <span key={sgIndex} className="px-2 py-1 bg-gray-200 text-gray-900 text-xs rounded">
                            {sg.name || sg.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab({ vm }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Security Details</h3>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Owner ID</p>
            <p className="font-mono text-sm mt-1">{vm.ownerId || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Key Pair Name</p>
            <p className="text-sm mt-1">{vm.keyName || '–'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Launch Time</p>
            <p className="text-sm mt-1">{vm.launchTime ? new Date(vm.launchTime).toLocaleString() : '–'}</p>
          </div>
        </div>
      </div>

      {vm.iamInstanceProfile && (
        <div>
          <h3 className="text-lg font-semibold mb-4">IAM Role</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Instance Profile ARN</p>
                <p className="font-mono text-sm mt-1 break-all">{vm.iamInstanceProfile.arn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instance Profile ID</p>
                <p className="font-mono text-sm mt-1">{vm.iamInstanceProfile.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {vm.securityGroups && vm.securityGroups.length > 0 && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-4">Security Groups ({vm.securityGroups.length})</h3>
            <div className="space-y-2">
              {vm.securityGroups.map((sg, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Security Group ID</p>
                      <p className="font-mono text-sm mt-1">{sg.id || sg}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Security Group Name</p>
                      <p className="text-sm mt-1">{sg.name || '–'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Inbound Rules
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Security group rule ID</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Port range</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Protocol</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Source</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Security groups</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">–</td>
                      <td className="px-4 py-3 text-sm font-mono">sgr-0b2156c24fd8f3cf1</td>
                      <td className="px-4 py-3 text-sm">22</td>
                      <td className="px-4 py-3 text-sm">TCP</td>
                      <td className="px-4 py-3 text-sm font-mono">0.0.0.0/0</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-900 hover:underline cursor-pointer">
                          {vm.securityGroups[0]?.name || 'launch-wizard-1'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">–</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Outbound Rules */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Outbound Rules
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Security group rule ID</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">IP version</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Protocol</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Port range</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Destination</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">–</td>
                      <td className="px-4 py-3 text-sm font-mono">sgr-example</td>
                      <td className="px-4 py-3 text-sm">IPv4</td>
                      <td className="px-4 py-3 text-sm">All traffic</td>
                      <td className="px-4 py-3 text-sm">All</td>
                      <td className="px-4 py-3 text-sm">All</td>
                      <td className="px-4 py-3 text-sm font-mono">0.0.0.0/0</td>
                      <td className="px-4 py-3 text-sm">–</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StorageTab({ vm }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Root Device Details</h3>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Root Device Name</p>
            <p className="font-mono text-sm mt-1">{vm.rootDeviceName || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Root Device Type</p>
            <p className="text-sm mt-1">{vm.rootDeviceType || '–'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">EBS Optimization</p>
            <p className="text-sm mt-1">{vm.ebsOptimized ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      {vm.blockDevices && vm.blockDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Block Devices ({vm.blockDevices.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Device Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Volume ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Attach Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Delete on Termination</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vm.blockDevices.map((bd, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-mono">{bd.deviceName}</td>
                    <td className="px-4 py-3 text-sm font-mono">{bd.volumeId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        bd.status === 'attached' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bd.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {bd.attachTime ? new Date(bd.attachTime).toLocaleString() : '–'}
                    </td>
                    <td className="px-4 py-3 text-sm">{bd.deleteOnTermination ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoringTab({ vm }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Monitoring Configuration</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600">CloudWatch Detailed Monitoring</p>
            <p className="text-sm mt-1 font-semibold">{vm.monitoring || 'disabled'}</p>
          </div>
        </div>
      </div>

      {vm.metrics && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Current Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">CPU Utilization</p>
              <p className="text-2xl font-bold mt-1">{vm.metrics.cpuUtilization?.toFixed(1) || '–'}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Memory Utilization</p>
              <p className="text-2xl font-bold mt-1">{vm.metrics.memoryUtilization?.toFixed(1) || '–'}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Disk Utilization</p>
              <p className="text-2xl font-bold mt-1">{vm.metrics.diskUtilization?.toFixed(1) || '–'}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Network In</p>
              <p className="text-2xl font-bold mt-1">{vm.metrics.networkIn?.toFixed(2) || '–'} MB</p>
            </div>
          </div>
          {vm.metrics.lastUpdated && (
            <p className="text-sm text-gray-600 mt-2">
              Last updated: {new Date(vm.metrics.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <p className="text-sm text-gray-800">
          For detailed monitoring charts and historical data, visit the{' '}
          <Link to="/monitoring" className="font-semibold underline">Monitoring Dashboard</Link>.
        </p>
      </div>
    </div>
  );
}

function TagsTab({ vm }) {
  const tags = vm.tags || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tags ({tags.length})</h3>
      </div>

      {tags.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Key</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium">{tag.Key || tag.key}</td>
                  <td className="px-4 py-3 text-sm">{tag.Value || tag.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No tags defined for this VM</p>
        </div>
      )}
    </div>
  );
}
