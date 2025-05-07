// ChallengeLayout.tsx
import React, { ReactNode } from 'react';
import { useGlobalData } from '../../contexts/GlobalDataContext';
import { Layout } from './Layout';

interface ChallengeLayoutProps {
  children: ReactNode;
  onBack: string;
}

const ChallengeLayout: React.FC<ChallengeLayoutProps> = ({ children, onBack }) => {
  const { competitiveSeason, seasonPeriod: currentWeek } = useGlobalData();

  // Formatage de la période de la semaine en format local
  const weekTooltip = `Semaine du ${currentWeek.start.toLocaleDateString()} au ${currentWeek.end.toLocaleDateString()}`;
  const headerTitle = `Challenges - Saison ${competitiveSeason}`;

  return (
    <Layout headerTitle={headerTitle} headerTooltip={weekTooltip} onBack={onBack}>
      {children}
    </Layout>
  );
};

export default ChallengeLayout;
