import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Send, Mail, MailOpen, Clock, Plus, Paperclip } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AdminMessaging() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const customers = [
    'ABC Trading Ltd.',
    'HomeStyle Inc.',
    'BuildMart Co.',
    'Elite Supplies',
    'Global Hardware Ltd.',
  ];

  const messages = [
    {
      id: 'MSG-001',
      recipient: 'ABC Trading Ltd.',
      recipientEmail: 'contact@abctrading.com',
      subject: 'Order #ORD-2025-0089 Update',
      body: 'Your order is currently in production and on schedule. Expected completion date is Nov 15.',
      sentDate: '2025-10-27 10:30',
      status: 'Sent',
      read: true,
      attachments: [],
    },
    {
      id: 'MSG-002',
      recipient: 'HomeStyle Inc.',
      recipientEmail: 'info@homestyle.com',
      subject: 'New Product Catalog Available',
      body: 'We are pleased to share our latest product catalog with new cabinet hardware collections.',
      sentDate: '2025-10-27 09:15',
      status: 'Sent',
      read: false,
      attachments: ['catalog_2025.pdf'],
    },
    {
      id: 'MSG-003',
      recipient: 'BuildMart Co.',
      recipientEmail: 'orders@buildmart.com',
      subject: 'Quotation #QUO-2025-0234 Follow-up',
      body: 'Following up on the quotation sent last week. Please let us know if you have any questions.',
      sentDate: '2025-10-26 16:45',
      status: 'Sent',
      read: true,
      attachments: [],
    },
    {
      id: 'MSG-004',
      recipient: 'Elite Supplies',
      recipientEmail: 'contact@elitesupplies.com',
      subject: 'Payment Confirmation',
      body: 'Draft message regarding payment confirmation.',
      sentDate: '',
      status: 'Draft',
      read: false,
      attachments: [],
    },
  ];

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || message.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSendMessage = () => {
    if (!recipient || !subject || !messageBody) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Message sent successfully');
    setShowComposeDialog(false);
    setRecipient('');
    setSubject('');
    setMessageBody('');
  };

  const handleSaveDraft = () => {
    toast.success('Message saved as draft');
    setShowComposeDialog(false);
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
            <h2 className="text-2xl mb-1">Message Center</h2>
            <p className="text-sm text-gray-600">Send emails and messages to customers</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Draft">Drafts</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Compose New Message</DialogTitle>
                  <DialogDescription>
                    Send an email message to a customer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Recipient *</Label>
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer} value={customer}>
                            {customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Message *</Label>
                    <Textarea
                      placeholder="Type your message here..."
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={8}
                    />
                  </div>
                  <div>
                    <Label>Attachments (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="file" multiple className="flex-1" />
                      <Button variant="outline" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowComposeDialog(false);
                        setRecipient('');
                        setSubject('');
                        setMessageBody('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="outline" onClick={handleSaveDraft}>
                      Save Draft
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleSendMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
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
          <p className="text-sm text-gray-600">Total Messages</p>
          <p className="text-2xl mt-1">{messages.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Sent</p>
          <p className="text-2xl mt-1 text-green-500">{messages.filter(m => m.status === 'Sent').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Drafts</p>
          <p className="text-2xl mt-1 text-gray-500">{messages.filter(m => m.status === 'Draft').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Read</p>
          <p className="text-2xl mt-1">{messages.filter(m => m.read).length}</p>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Read Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="text-blue-600">{message.id}</TableCell>
                  <TableCell>
                    <div>
                      <p>{message.recipient}</p>
                      <p className="text-sm text-gray-600">{message.recipientEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{message.subject}</p>
                  </TableCell>
                  <TableCell>
                    {message.sentDate ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{message.sentDate}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(message.status)}>{message.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {message.status === 'Sent' && (
                      <div className="flex items-center gap-2">
                        {message.read ? (
                          <>
                            <MailOpen className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Read</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Unread</span>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Message Details - {selectedMessage?.id}</DialogTitle>
                          <DialogDescription>
                            View complete message information
                          </DialogDescription>
                        </DialogHeader>
                        {selectedMessage && (
                          <div className="space-y-6">
                            {/* Message Header */}
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4 bg-gray-50">
                                <p className="text-sm text-gray-600">To</p>
                                <p className="mt-1">{selectedMessage.recipient}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedMessage.recipientEmail}</p>
                              </Card>
                              <Card className="p-4 bg-gray-50">
                                <p className="text-sm text-gray-600">Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(selectedMessage.status)}>
                                    {selectedMessage.status}
                                  </Badge>
                                  {selectedMessage.status === 'Sent' && (
                                    <Badge variant="outline" className={selectedMessage.read ? 'bg-green-50' : ''}>
                                      {selectedMessage.read ? 'Read' : 'Unread'}
                                    </Badge>
                                  )}
                                </div>
                              </Card>
                            </div>

                            {/* Subject */}
                            <div>
                              <h3 className="mb-2">Subject</h3>
                              <p className="text-lg">{selectedMessage.subject}</p>
                            </div>

                            {/* Date/Time */}
                            {selectedMessage.sentDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Sent on {selectedMessage.sentDate}</span>
                              </div>
                            )}

                            {/* Message Body */}
                            <div>
                              <h3 className="mb-2">Message</h3>
                              <Card className="p-4 bg-gray-50">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.body}</p>
                              </Card>
                            </div>

                            {/* Attachments */}
                            {selectedMessage.attachments.length > 0 && (
                              <div>
                                <h3 className="mb-3">Attachments</h3>
                                <div className="space-y-2">
                                  {selectedMessage.attachments.map((attachment: string, index: number) => (
                                    <Card key={index} className="p-3 bg-blue-50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Paperclip className="w-4 h-4 text-blue-600" />
                                          <span>{attachment}</span>
                                        </div>
                                        <Button variant="outline" size="sm">
                                          Download
                                        </Button>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                              {selectedMessage.status === 'Draft' && (
                                <>
                                  <Button className="bg-red-600 hover:bg-red-700">
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Now
                                  </Button>
                                  <Button variant="outline">Edit</Button>
                                </>
                              )}
                              {selectedMessage.status === 'Sent' && (
                                <Button variant="outline">Forward</Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Quick Templates */}
      <Card className="p-6">
        <h3 className="mb-4">Message Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <h4 className="mb-2">Order Update</h4>
            <p className="text-sm text-gray-600">Template for sending order status updates</p>
          </Card>
          <Card className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <h4 className="mb-2">Payment Reminder</h4>
            <p className="text-sm text-gray-600">Template for payment follow-up</p>
          </Card>
          <Card className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <h4 className="mb-2">Quotation Follow-up</h4>
            <p className="text-sm text-gray-600">Template for following up on quotations</p>
          </Card>
        </div>
      </Card>
    </div>
  );
}
