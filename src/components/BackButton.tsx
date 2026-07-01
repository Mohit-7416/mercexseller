import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  to?: string;
  label?: string;
  className?: string;
}

const BackButton = ({ to, label = "Back", className = "" }: Props) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`gap-1.5 -ml-2 mb-2 text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
};

export default BackButton;
