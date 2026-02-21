import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Mail, 
  Send, 
  Inbox,
  FileText,
  Paperclip,
  Clock,
  CheckCircle2,
  User
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

export function InternalMessaging() {
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  // Mock message threads
  const messageThreads = [
    {
      id: 1,
      subject: 'Order ORD-2025-089 Shipment Update',
      lastMessage: 'Your order has been shipped and is currently in transit. Expected delivery: Feb 5, 2025.',
      from: 'COSUN Logistics Team',
      date: '2025-01-20 14:30',
      status: 'unread',
      hasAttachment: true,
      messages: [
        {
          id: 1,
          sender: 'You',
          content: 'Hi, could you please provide an update on order ORD-2025-089?',
          timestamp: '2025-01-20 10:15',
          isCustomer: true
        },
        {
          id: 2,
          sender: 'COSUN Logistics Team',
          content: 'Your order has been shipped and is currently in transit. Expected delivery: Feb 5, 2025. Tracking number: COSN-TRK-2025-089',
          timestamp: '2025-01-20 14:30',
          isCustomer: false,
          attachment: 'shipping_manifest.pdf'
        }
      ]
    },
    {
      id: 2,
      subject: 'Quotation Request - LED Panel Lights',
      lastMessage: 'We have prepared a detailed quotation for your inquiry. Please review the attached document.',
      from: 'COSUN Sales Team',
      date: '2025-01-18 11:20',
      status: 'read',
      hasAttachment: true,
      messages: [
        {
          id: 1,
          sender: 'You',
          content: 'I would like to request a quotation for 2000 units of LED Panel Light 60x60cm.',
          timestamp: '2025-01-18 09:00',
          isCustomer: true
        },
        {
          id: 2,
          sender: 'COSUN Sales Team',
          content: 'Thank you for your inquiry. We have prepared a detailed quotation for your inquiry. Unit price: $15.50, Total: $31,000. Please review the attached document for full details.',
          timestamp: '2025-01-18 11:20',
          isCustomer: false,
          attachment: 'quotation_LED_panels.pdf'
        }
      ]
    },
    {
      id: 3,
      subject: 'Product Quality Question',
      lastMessage: 'All our LED panels come with CE, RoHS, and UL certifications. Test reports attached.',
      from: 'COSUN QC Department',
      date: '2025-01-15 16:45',
      status: 'read',
      hasAttachment: true,
      messages: [
        {
          id: 1,
          sender: 'You',
          content: 'Do you have quality certifications for the LED panel lights?',
          timestamp: '2025-01-15 14:00',
          isCustomer: true
        },
        {
          id: 2,
          sender: 'COSUN QC Department',
          content: 'Yes, all our LED panels come with CE, RoHS, and UL certifications. I have attached the test reports for your review.',
          timestamp: '2025-01-15 16:45',
          isCustomer: false,
          attachment: 'certificates_LED.pdf'
        }
      ]
    },
  ];

  const [selectedThread, setSelectedThread] = useState<any>(messageThreads[0]);

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;
    
    // Here you would send the message to your backend
    console.log('Sending message:', {
      subject: messageSubject,
      content: messageContent
    });

    // Reset form
    setMessageContent('');
    setMessageSubject('');
    
    // Show success notification
    alert('Message sent successfully to COSUN team!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Communicate directly with COSUN team</p>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="inbox">
            <Inbox className="h-4 w-4 mr-2" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            New Message
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Message List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {messageThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-red-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-semibold truncate ${
                                thread.status === 'unread' ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {thread.subject}
                              </h4>
                              {thread.status === 'unread' && (
                                <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{thread.from}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{thread.lastMessage}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {thread.date}
                          </span>
                          {thread.hasAttachment && (
                            <Paperclip className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b">
                <div>
                  <CardTitle>{selectedThread.subject}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{selectedThread.from}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px] p-6">
                  <div className="space-y-6">
                    {selectedThread.messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.isCustomer ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isCustomer ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className={`flex-1 ${message.isCustomer ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-gray-900">{message.sender}</p>
                            <span className="text-xs text-gray-500">{message.timestamp}</span>
                          </div>
                          <div className={`inline-block max-w-[80%] rounded-lg p-4 ${
                            message.isCustomer 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.attachment && (
                              <div className={`mt-3 pt-3 border-t ${
                                message.isCustomer ? 'border-blue-500' : 'border-gray-300'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{message.attachment}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Reply Box */}
                <div className="border-t p-4">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your reply..."
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach File
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>New Message to COSUN</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="recipient">To</Label>
                <Input
                  id="recipient"
                  value="COSUN Support Team"
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter message subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={12}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Our team typically responds within 24 hours during business days
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white ml-auto"
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || !messageSubject.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
