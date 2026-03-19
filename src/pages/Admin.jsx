import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiImage, FiTrendingUp, FiSettings, FiPlus, FiTrash2, FiEdit, FiUpload, FiEye, FiHeart, FiShoppingBag } from 'react-icons/fi';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = {
    users: 12543,
    outfits: 856,
    recommendations: 45678,
    revenue: 125000
  };

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', joined: '2 hours ago', status: 'Active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', joined: '5 hours ago', status: 'Active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', joined: '1 day ago', status: 'Pending' },
  ];

  const recentOutfits = [
    { id: 1, name: 'Summer Floral Dress', category: 'Casual', views: 1234, likes: 234 },
    { id: 2, name: 'Party Glitter Dress', category: 'Party', views: 987, likes: 156 },
    { id: 3, name: 'Wedding Guest Saree', category: 'Wedding', views: 856, likes: 123 },
  ];

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FiTrendingUp },
    { id: 'outfits', name: 'Manage Outfits', icon: FiImage },
    { id: 'users', name: 'Manage Users', icon: FiUsers },
    { id: 'settings', name: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-500">Manage your FashionAI platform</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FiUsers className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-green-500 text-sm">+12%</span>
                    </div>
                    <h3 className="text-2xl font-bold">{stats.users.toLocaleString()}</h3>
                    <p className="text-gray-500">Total Users</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <FiImage className="w-6 h-6 text-secondary" />
                      </div>
                      <span className="text-green-500 text-sm">+8%</span>
                    </div>
                    <h3 className="text-2xl font-bold">{stats.outfits}</h3>
                    <p className="text-gray-500">Total Outfits</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-accent" />
                      </div>
                      <span className="text-green-500 text-sm">+25%</span>
                    </div>
                    <h3 className="text-2xl font-bold">{stats.recommendations.toLocaleString()}</h3>
                    <p className="text-gray-500">Recommendations</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <FiShoppingBag className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-green-500 text-sm">+18%</span>
                    </div>
                    <h3 className="text-2xl font-bold">${stats.revenue.toLocaleString()}</h3>
                    <p className="text-gray-500">Revenue</p>
                  </div>
                </div>

                {/* Recent Users */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
                  <h2 className="text-xl font-bold mb-6">Recent Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium">User</th>
                          <th className="text-left py-3 px-4 font-medium">Joined</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((user) => (
                          <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-500">{user.joined}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.status === 'Active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                  <FiEdit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Outfits */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
                  <h2 className="text-xl font-bold mb-6">Top Performing Outfits</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium">Outfit</th>
                          <th className="text-left py-3 px-4 font-medium">Category</th>
                          <th className="text-left py-3 px-4 font-medium">Views</th>
                          <th className="text-left py-3 px-4 font-medium">Likes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOutfits.map((outfit) => (
                          <tr key={outfit.id} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-4 font-medium">{outfit.name}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                {outfit.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">{outfit.views.toLocaleString()}</td>
                            <td className="py-3 px-4 flex items-center space-x-1">
                              <FiHeart className="w-4 h-4 text-secondary" />
                              <span>{outfit.likes}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'outfits' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Manage Outfits</h2>
                  <button className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg">
                    <FiPlus />
                    <span>Add Outfit</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium">Image</th>
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOutfits.map((outfit) => (
                        <tr key={outfit.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4">
                            <img src={outfit.image} alt={outfit.name} className="w-12 h-12 object-cover rounded-lg" />
                          </td>
                          <td className="py-3 px-4 font-medium">{outfit.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {outfit.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-500">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Manage Users</h2>
                  <button className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg">
                    <FiPlus />
                    <span>Add User</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium">User</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{user.joined}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.status === 'Active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-500">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-6">Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">General Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Maintenance Mode</p>
                          <p className="text-sm text-gray-500">Enable to put the site in maintenance mode</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive email notifications for new users</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

