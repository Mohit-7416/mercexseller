import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  to?: string;
  className?: string;
  ariaLabel?: string;
}

const BackButton = ({ to, className = "", ariaLabel = "Go back" }: Props) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`h-9 w-9 rounded-full hover:bg-card/60 shrink-0 ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );
};

export default BackButton;
