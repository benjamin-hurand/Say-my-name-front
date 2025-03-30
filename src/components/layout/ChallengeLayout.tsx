// ChallengeLayout.tsx
import React, { ReactNode } from 'react';
import { useGlobalData } from '../../contexts/GlobalDataContext';
import { Layout } from './Layout';

interface ChallengeLayoutProps {
  children: ReactNode;
}

const ChallengeLayout: React.FC<ChallengeLayoutProps> = ({ children }) => {
  const { competitiveSeason, currentWeek } = useGlobalData();

  // Formatage de la période de la semaine en format local
  const weekTooltip = `Semaine du ${currentWeek.start.toLocaleDateString()} au ${currentWeek.end.toLocaleDateString()}`;
  const headerTitle = `Challenges - Saison ${competitiveSeason}`;

  return (
    <Layout headerTitle={headerTitle} headerTooltip={weekTooltip}>
      {children}
    </Layout>
  );
};

export default ChallengeLayout;
