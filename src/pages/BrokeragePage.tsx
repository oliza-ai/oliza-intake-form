import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { brokerages } from "@/config/brokerages";
import BuyerGuideForm from "@/components/BuyerGuideForm";

const BrokeragePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? brokerages[slug] : undefined;

  if (!config) {
    return <Navigate to="/duston-leddy" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Generate Buyer Guide | {config.name}</title>
        <meta
          name="description"
          content={`Create a personalized home buyer guide with ${config.name} in under 3 minutes.`}
        />
      </Helmet>
      <BuyerGuideForm brokerage={config} />
    </>
  );
};

export default BrokeragePage;
