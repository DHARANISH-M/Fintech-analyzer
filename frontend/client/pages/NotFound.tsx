import { Layout } from "@/components/Layout";
import { AlertTriangle } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <PlaceholderPage
        icon={<AlertTriangle className="w-24 h-24" />}
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Please check the URL and try again."
      />
    </Layout>
  );
};

export default NotFound;
