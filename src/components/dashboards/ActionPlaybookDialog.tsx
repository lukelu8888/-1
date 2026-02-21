// 🚀 客户开发执行手册弹窗组件
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Book, Rocket } from "lucide-react";
import { SalesRepActionPlaybook } from "./SalesRepActionPlaybook";
import { User } from "../../lib/rbac-config";

interface ActionPlaybookDialogProps {
  user: User;
}

export function ActionPlaybookDialog({ user }: ActionPlaybookDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg animate-pulse"
          size="lg"
        >
          <Rocket className="size-5" />
          <div className="text-left">
            <div className="font-bold">客户开发执行手册</div>
            <div className="text-xs opacity-90">7个阶段完整SOP</div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <div className="h-[90vh] overflow-y-auto">
          <SalesRepActionPlaybook user={user} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
