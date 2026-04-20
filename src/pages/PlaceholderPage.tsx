import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const name = pathname.slice(1).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="shadow-soft-sm max-w-sm w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-3">
          <Construction className="h-10 w-10 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">This page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
