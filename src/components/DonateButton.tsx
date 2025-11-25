import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const DonateButton = () => {
  const upiLink = "upi://pay?pa=gumu642@okicici&pn=AI%20Notes%20Generator&cu=INR";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
        >
          <Heart className="w-4 h-4 mr-2 fill-current" />
          Donate
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Support Development ❤️</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Even a small coffee helps maintain free access!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-secondary p-6 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">UPI ID:</p>
            <p className="text-lg font-mono font-bold text-primary break-all">
              gumu642@okicici
            </p>
          </div>
          <Button
            onClick={() => window.open(upiLink, "_blank")}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all hover:scale-105"
          >
            Open UPI Payment
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your support keeps this tool free for all students 🙏
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
