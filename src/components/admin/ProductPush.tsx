import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Plus, Send, Eye, Edit, Trash2, Package, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ProductPush() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const customers = [
    { id: 'CUST-001', name: 'ABC Trading Ltd.', email: 'contact@abctrading.com' },
    { id: 'CUST-002', name: 'HomeStyle Inc.', email: 'info@homestyle.com' },
    { id: 'CUST-003', name: 'BuildMart Co.', email: 'orders@buildmart.com' },
    { id: 'CUST-004', name: 'Elite Supplies', email: 'contact@elitesupplies.com' },
    { id: 'CUST-005', name: 'Global Hardware Ltd.', email: 'sales@globalhardware.com' },
  ];

  const notifications = [
    {
      id: 'NOTIF-001',
      title: 'New Smart Door Lock Series',
      description: 'Introducing our latest smart door lock collection with advanced security features.',
      products: ['Smart Cylindrical Lock SL-200', 'Smart Lever Lock SL-300'],
      recipients: ['ABC Trading Ltd.', 'HomeStyle Inc.', 'BuildMart Co.'],
      sentDate: '2025-10-25',
      status: 'Sent',
      viewed: 2,
    },
    {
      id: 'NOTIF-002',
      title: 'Premium Cabinet Hardware Collection',
      description: 'New premium line of soft-close hinges and drawer slides with 10-year warranty.',
      products: ['Premium Soft-Close Hinge PCH-100', 'Premium Drawer Slide PDS-200'],
      recipients: ['HomeStyle Inc.', 'Elite Supplies'],
      sentDate: '2025-10-20',
      status: 'Sent',
      viewed: 1,
    },
    {
      id: 'NOTIF-003',
      title: 'Energy-Efficient Window Hardware',
      description: 'Draft for new eco-friendly window hardware series.',
      products: ['Eco Window Lock EWL-100'],
      recipients: [],
      sentDate: '',
      status: 'Draft',
      viewed: 0,
    },
  ];

  const filteredNotifications = notifications.filter((notif) =>
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleCreateNotification = () => {
    if (!productTitle || !productDescription || selectedCustomers.length === 0) {
      toast.error('Please fill in all fields and select at least one customer');
      return;
    }
    toast.success('Product notification created successfully');
    setShowCreateDialog(false);
    setProductTitle('');
    setProductDescription('');
    setSelectedCustomers([]);
  };

  const handleSendNotification = (notifId: string) => {
    toast.success(`Notification ${notifId} sent to customers`);
  };

  const handleDeleteNotification = (notifId: string) => {
    toast.success(`Notification ${notifId} deleted`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-green-500';
      case 'Draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl mb-1">Product Push Notifications</h2>
            <p className="text-sm text-gray-600">Send new product updates to customers</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Push
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Product Push Notification</DialogTitle>
                  <DialogDescription>
                    Create and send product updates to selected customers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Product Information */}
                  <div className="space-y-4">
                    <div>
                      <Label>Product Title *</Label>
                      <Input
                        placeholder="Enter product title"
                        value={productTitle}
                        onChange={(e) => setProductTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Product Description *</Label>
                      <Textarea
                        placeholder="Enter product description..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Product Images (Optional)</Label>
                      <Input type="file" multiple accept="image/*" />
                      <p className="text-xs text-gray-600 mt-1">Upload product images (max 5 images)</p>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div>
                    <Label className="mb-3 block">Select Recipients *</Label>
                    <Card className="p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-3">
                        {customers.map((customer) => (
                          <div key={customer.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={customer.id}
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() => handleCustomerToggle(customer.id)}
                            />
                            <label htmlFor={customer.id} className="flex-1 cursor-pointer">
                              <p className="text-sm">{customer.name}</p>
                              <p className="text-xs text-gray-600">{customer.email}</p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedCustomers.length} customer(s) selected
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setProductTitle('');
                        setProductDescription('');
                        setSelectedCustomers([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="outline" onClick={handleCreateNotification}>
                      Save as Draft
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        handleCreateNotification();
                        toast.success('Notification sent to selected customers');
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Notifications</p>
          <p className="text-2xl mt-1">{notifications.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Sent</p>
          <p className="text-2xl mt-1 text-green-500">{notifications.filter(n => n.status === 'Sent').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Drafts</p>
          <p className="text-2xl mt-1 text-gray-500">{notifications.filter(n => n.status === 'Draft').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-2xl mt-1">{notifications.reduce((sum, n) => sum + n.viewed, 0)}</p>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Viewed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="text-blue-600">{notif.id}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{notif.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Package className="w-3 h-3" />
                      {notif.products.length}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Users className="w-3 h-3" />
                      {notif.recipients.length}
                    </Badge>
                  </TableCell>
                  <TableCell>{notif.sentDate || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(notif.status)}>{notif.status}</Badge>
                  </TableCell>
                  <TableCell>{notif.viewed}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedNotification(notif)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Notification Details - {selectedNotification?.id}</DialogTitle>
                            <DialogDescription>
                              View complete notification information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedNotification && (
                            <div className="space-y-6">
                              <div>
                                <h3 className="mb-2">Title</h3>
                                <p className="text-lg">{selectedNotification.title}</p>
                              </div>
                              <div>
                                <h3 className="mb-2">Description</h3>
                                <Card className="p-4 bg-gray-50">
                                  <p className="text-gray-700">{selectedNotification.description}</p>
                                </Card>
                              </div>
                              <div>
                                <h3 className="mb-3">Products</h3>
                                <div className="space-y-2">
                                  {selectedNotification.products.map((product: string, index: number) => (
                                    <Card key={index} className="p-3 bg-blue-50">
                                      <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-600" />
                                        <span>{product}</span>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                              {selectedNotification.recipients.length > 0 && (
                                <div>
                                  <h3 className="mb-3">Recipients</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedNotification.recipients.map((recipient: string, index: number) => (
                                      <Badge key={index} variant="outline">{recipient}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-4">
                                <Card className="p-3 bg-gray-50">
                                  <p className="text-sm text-gray-600">Status</p>
                                  <Badge className={`mt-1 ${getStatusColor(selectedNotification.status)}`}>
                                    {selectedNotification.status}
                                  </Badge>
                                </Card>
                                {selectedNotification.sentDate && (
                                  <Card className="p-3 bg-gray-50">
                                    <p className="text-sm text-gray-600">Sent Date</p>
                                    <p className="mt-1">{selectedNotification.sentDate}</p>
                                  </Card>
                                )}
                                <Card className="p-3 bg-gray-50">
                                  <p className="text-sm text-gray-600">Viewed</p>
                                  <p className="mt-1 text-xl">{selectedNotification.viewed}</p>
                                </Card>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {notif.status === 'Draft' && (
                        <>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleSendNotification(notif.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNotification(notif.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
