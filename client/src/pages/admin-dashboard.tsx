import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  Store, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle,
  Settings,
  BarChart3,
  MessageSquare,
  Bell,
  Shield,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  const handleLogout = () => {
    setLocation("/login");
  };

  const statCards = [
    {
      title: "Total Users",
      value: users?.length || 0,
      icon: <Users className="h-6 w-6" />,
      description: "Registered customers & sellers",
      color: "text-blue-600"
    },
    {
      title: "Active Products",
      value: products?.length || 0,
      icon: <Package className="h-6 w-6" />,
      description: "Products across all categories",
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: <ShoppingCart className="h-6 w-6" />,
      description: "Orders processed",
      color: "text-purple-600"
    },
    {
      title: "Revenue",
      value: "₹0",
      icon: <TrendingUp className="h-6 w-6" />,
      description: "Total platform revenue",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">VyronaMart Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </Button>
            <Button
              variant={activeTab === "products" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("products")}
            >
              <Package className="h-4 w-4 mr-2" />
              Product Management
            </Button>
            <Button
              variant={activeTab === "sellers" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("sellers")}
            >
              <Store className="h-4 w-4 mr-2" />
              Seller Management
            </Button>
            <Button
              variant={activeTab === "vyronahub" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("vyronahub")}
            >
              <Package className="h-4 w-4 mr-2" />
              VyronaHub Access
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Management
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("analytics")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === "support" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("support")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Support & Issues
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Overview</h2>
                <p className="text-gray-600 dark:text-gray-300">Monitor key metrics and platform health</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                        </div>
                        <div className={`${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent User Registrations</CardTitle>
                    <CardDescription>Latest users joined the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users?.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No users registered yet</p>
                    ) : (
                      <div className="space-y-4">
                        {users?.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                    <CardDescription>Important notifications and warnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Platform Setup</p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">Configure initial platform settings</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage customers, sellers, and their accounts</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {users?.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Users Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400">Users will appear here once they register</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users?.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Product Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Full control over all platform products</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Catalog Control</CardTitle>
                  <CardDescription>Edit, moderate, and manage all products across VyronaMart</CardDescription>
                </CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Products Listed</h3>
                      <p className="text-gray-500 dark:text-gray-400">Add products or wait for sellers to list items</p>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Product
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products?.map((product: any) => (
                        <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">{product.module}</Badge>
                                    <Badge variant="secondary">{product.category}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    {product.description || "No description available"}
                                  </p>
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-xl text-green-600">₹{(product.price / 100).toLocaleString()}</span>
                                    <span className="text-sm text-gray-500">ID: {product.id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "sellers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Management</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage seller accounts and store approvals</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seller
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Accounts</CardTitle>
                    <CardDescription>Manage seller registrations and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!users || users.filter((user: any) => user.role === 'seller').length === 0 ? (
                      <div className="text-center py-8">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No sellers registered yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {users?.filter((user: any) => user.role === 'seller').map((seller: any) => (
                          <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Store className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{seller.username}</p>
                                <p className="text-xs text-gray-500">{seller.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={seller.isActive ? 'default' : 'secondary'}>
                                {seller.isActive ? 'Active' : 'Pending'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seller Performance</CardTitle>
                    <CardDescription>Track seller metrics and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <span className="font-bold text-green-600">₹2,45,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Sellers</span>
                        <span className="font-bold">{users?.filter((user: any) => user.role === 'seller' && user.isActive).length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Approvals</span>
                        <span className="font-bold text-orange-600">{users?.filter((user: any) => user.role === 'seller' && !user.isActive).length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "vyronahub" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">VyronaHub Access</h2>
                <p className="text-gray-600 dark:text-gray-300">Full access to user and seller features</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/vyronahub')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Product Catalog</h3>
                        <p className="text-sm text-gray-500">Browse all products</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/social')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">VyronaSocial</h3>
                        <p className="text-sm text-gray-500">Social shopping features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/instashop')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Store className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">InstaShop</h3>
                        <p className="text-sm text-gray-500">Instagram integration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/seller-dashboard')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Seller Dashboard</h3>
                        <p className="text-sm text-gray-500">Seller panel access</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/home')}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Customer View</h3>
                        <p className="text-sm text-gray-500">User experience</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Admin Only</h3>
                        <p className="text-sm text-gray-500">Exclusive features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Direct access to key platform functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-xs">Manage Users</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-xs">Add Product</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Store className="h-6 w-6 mb-2" />
                      <span className="text-xs">Approve Sellers</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-xs">View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other tabs content would go here */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300">Platform performance and insights</p>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">Detailed analytics will be available once the platform has data</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}