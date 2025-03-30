import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Stack, useTheme } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  // Optionnel: largeur par "page" pour calculer le nombre de pages
  pageWidth?: number;
}

const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({ children, pageWidth = 300 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const visibleWidth = scrollRef.current.clientWidth;
      // Calculer le nombre de pages (arrondi)
      setPageCount(Math.ceil(scrollWidth / visibleWidth));
    }
  }, [children]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const visibleWidth = scrollRef.current.clientWidth;
      const scrollAmount = visibleWidth; // scroll par "page"
      const newPosition = direction === 'right'
        ? scrollRef.current.scrollLeft + scrollAmount
        : scrollRef.current.scrollLeft - scrollAmount;
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      // Calculer la nouvelle page (approximativement)
      const newPage = Math.round(newPosition / visibleWidth);
      setCurrentPage(newPage);
    }
  };

  // Optionnel: affichage des points de pagination
  const renderPaginationDots = () => {
    const dots = [];
    for (let i = 0; i < pageCount; i++) {
      dots.push(
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: i === currentPage ? theme.palette.primary.main : 'grey.400',
            margin: '0 4px',
          }}
        />
      );
    }
    return <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>{dots}</Stack>;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        onClick={() => handleScroll('left')}
        sx={{ position: 'absolute', top: '50%', left: 0, zIndex: 1, transform: 'translateY(-50%)' }}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <Box
        ref={scrollRef}
        sx={{
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          display: 'flex',
          gap: 1,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {children}
      </Box>
      <IconButton
        onClick={() => handleScroll('right')}
        sx={{ position: 'absolute', top: '50%', right: 0, zIndex: 1, transform: 'translateY(-50%)' }}
      >
        <ArrowForwardIosIcon />
      </IconButton>
      {renderPaginationDots()}
    </Box>
  );
};

export default HorizontalScroller;
