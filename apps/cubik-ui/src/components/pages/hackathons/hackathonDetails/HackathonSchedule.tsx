import {
  Box,
  HStack,
  Step,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  VStack,
  useSteps,
} from '@chakra-ui/react';
import React from 'react';
import { BiCalendar } from 'react-icons/bi';
import { BsCheckCircle } from 'react-icons/bs';
import { CgTimelapse } from 'react-icons/cg';
import { formateDateInMonths } from '~/utils/formatDates';

const steps: { title: string; startDate: Date; endDate?: Date }[] = [
  {
    title: 'Registration Starts',
    startDate: new Date('2023-06-30T00:00:00+0000'),
  },
  {
    title: 'Game Jam',
    startDate: new Date('2023-07-26T00:00:00+0000'),
    endDate: new Date('2023-07-30T00:00:00+0000'),
  },
  {
    title: 'Voting Period',
    startDate: new Date('2023-08-01T00:00:00+0000'),
    endDate: new Date('2023-08-06T00:00:00+0000'),
  },
  {
    title: 'Results',
    startDate: new Date('2023-08-07T00:00:00+0000'),
  },
];

const HackathonSchedule = () => {
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  return (
    <Stepper
      index={activeStep}
      colorScheme="teal"
      orientation="vertical"
      gap="0"
      w="full"
    >
      {steps.map((step, index) => (
        <Step key={index} style={{ width: '100%' }}>
          <StepIndicator
            borderColor={activeStep === index ? '#14665B' : '#1D1F1E'}
            bg={activeStep === index ? '#14665B' : '#1D1F1E'}
          >
            <StepStatus
              complete={
                <Box
                  as={BsCheckCircle}
                  rounded="full"
                  width="12px"
                  height="12px"
                  bg="#A8F0E6"
                />
              }
              incomplete={
                <Box rounded="full" width="12px" height="12px" bg="#3B3D3D" />
              }
              active={<CgTimelapse color="#A8F0E6" />}
            />
          </StepIndicator>
          <VStack
            w="90%"
            ml={'1rem'}
            mb="32px"
            border="1px solid"
            borderColor={'neutral.3'}
            backgroundColor={'neutral.2'}
            padding="24px"
            h="fit-content"
            rounded={'12px'}
            flexShrink="0"
            align={'start'}
            spacing="12px"
          >
            <Box as="p" textStyle={'title2'} color="neutral.11">
              {step.title}
            </Box>
            <HStack gap="12px">
              <HStack bg="neutral.4" rounded="12px" p="12px" spacing="8px">
                <Box
                  as={BiCalendar}
                  color="white"
                  boxSize={{ base: '16px', md: '22px' }}
                />
                <Box as="p" textStyle={'title4'} color="neutral.11">
                  {formateDateInMonths(step.startDate)}
                </Box>
              </HStack>
              {step.endDate && (
                <HStack bg="neutral.4" rounded="12px" p="12px" spacing="8px">
                  <Box
                    as={BiCalendar}
                    color="white"
                    boxSize={{ base: '16px', md: '22px' }}
                  />
                  <Box as="p" textStyle={'title4'} color="neutral.11">
                    {formateDateInMonths(step.endDate)}
                  </Box>
                </HStack>
              )}
            </HStack>
          </VStack>
          {/* @ts-ignore */}
          <StepSeparator bg="#1D1F1E" />
        </Step>
      ))}
    </Stepper>
  );
};

export default HackathonSchedule;
