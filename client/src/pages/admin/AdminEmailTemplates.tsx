import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Mail, 
  Edit,
  Eye
} from "lucide-react";

type TemplateFormData = {
  name: string;
  subject: string;
  body: string;
};

const defaultTemplateForm: TemplateFormData = {
  name: "",
  subject: "",
  body: ""
};

export default function AdminEmailTemplates() {
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.emailTemplates.list.useQuery();
  
  const updateTemplate = trpc.emailTemplates.upsert.useMutation({
    onSuccess: () => {
      utils.emailTemplates.list.invalidate();
      toast.success("Template updated");
      setEditingTemplate(null);
      setTemplateForm(defaultTemplateForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    }
  });
  
  const [editingTemplate, setEditingTemplate] = useState<NonNullable<typeof templates>[0] | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NonNullable<typeof templates>[0] | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormData>(defaultTemplateForm);
  
  const handleEditTemplate = (template: NonNullable<typeof templates>[0]) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.htmlContent
    });
  };
  
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    updateTemplate.mutate({
      name: editingTemplate.name,
      subject: templateForm.subject,
      htmlContent: templateForm.body,
      isActive: true
    });
  };
  
  const getTemplateDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      "otp_verification": "Sent when user requests email verification",
      "password_reset": "Sent when user requests password reset",
      "order_created": "Sent when a new order is placed",
      "payment_instructions": "Sent with manual payment instructions",
      "payment_verified": "Sent when payment is verified",
      "payment_rejected": "Sent when payment is rejected",
      "credentials_delivered": "Sent when IPTV credentials are assigned",
      "new_chat_message": "Sent when new chat message is received"
    };
    return descriptions[name] || "Email template";
  };
  
  const getAvailableVariables = (name: string) => {
    const variables: Record<string, string[]> = {
      "otp_verification": ["{{name}}", "{{otp_code}}", "{{expiry_minutes}}"],
      "password_reset": ["{{name}}", "{{reset_link}}", "{{expiry_minutes}}"],
      "order_created": ["{{name}}", "{{order_id}}", "{{plan_name}}", "{{connections}}", "{{price}}"],
      "payment_instructions": ["{{name}}", "{{order_id}}", "{{payment_method}}", "{{instructions}}", "{{price}}"],
      "payment_verified": ["{{name}}", "{{order_id}}", "{{plan_name}}", "{{connections}}"],
      "payment_rejected": ["{{name}}", "{{order_id}}", "{{reason}}"],
      "credentials_delivered": ["{{name}}", "{{credential_type}}", "{{server_url}}", "{{username}}", "{{password}}", "{{m3u_url}}", "{{epg_url}}", "{{portal_url}}", "{{mac_address}}"],
      "new_chat_message": ["{{name}}", "{{sender_name}}", "{{message_preview}}"]
    };
    return variables[name] || [];
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Customize email notifications</p>
        </div>
        
        {/* Info Card */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-600 dark:text-blue-400">Template Variables</p>
                <p className="text-muted-foreground mt-1">
                  Use variables like {"{{name}}"} in your templates. They will be replaced with actual values when emails are sent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
            <CardDescription>Edit email content and subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No email templates configured</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium capitalize">
                                {template.name.replace(/_/g, " ")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {getTemplateDescription(template.name)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="truncate block">{template.subject}</span>
                        </TableCell>
                        <TableCell>
                          {template.isActive ? (
                            <Badge className="badge-verified">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setPreviewTemplate(template)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Edit Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => {
          setEditingTemplate(null);
          setTemplateForm(defaultTemplateForm);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">
                Edit {editingTemplate?.name.replace(/_/g, " ")} Template
              </DialogTitle>
              <DialogDescription>
                {editingTemplate && getTemplateDescription(editingTemplate.name)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject line"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Body (HTML supported)</Label>
                <Textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Email body content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              {editingTemplate && (
                <div className="p-3 rounded-lg bg-muted">
                  <Label className="text-xs text-muted-foreground">Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getAvailableVariables(editingTemplate.name).map(v => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditingTemplate(null);
                setTemplateForm(defaultTemplateForm);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">
                Preview: {previewTemplate?.name.replace(/_/g, " ")}
              </DialogTitle>
              <DialogDescription>
                Subject: {previewTemplate?.subject}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div 
                className="p-4 rounded-lg border bg-white text-black"
                dangerouslySetInnerHTML={{ __html: previewTemplate?.htmlContent || "" }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
