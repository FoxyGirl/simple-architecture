import { useLocation, useNavigationType } from 'react-router-dom';

// Renders the router state the URL-sync suites assert against.
export const LocationProbe = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <output data-testid="navigation-type">{navigationType}</output>
    </>
  );
};
