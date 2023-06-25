import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Stack,
  useToast,
  VStack,
} from '@chakra-ui/react';
import * as anchor from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import FlipNumbers from 'react-flip-numbers';
import { useForm } from 'react-hook-form';
import { FailureToast, SuccessToast } from '~/components/common/toasts/Toasts';
import { tokens } from '~/components/common/tokens/DonationTokens';
import { DonationFormType } from '~/interfaces/donationForm';
import { tokenGroup } from '~/interfaces/token';
import { useUserStore } from '~/store/userStore';

import { ProjectsModel } from '@prisma/client';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import axios from 'axios';
import useCurrentTokenPrice from '~/hooks/useCurrentTokenPrice';
import {
  connection,
  contributeSOL,
  contributeSPL,
} from '~/utils/program/contract';
import { trpc } from '~/utils/trpc';
import { AmountInput } from './form/DonationAmountInput';

type ProjectDonationSimulatorProps = {
  projectDetails: ProjectsModel;
  height: number;
  width: number;
  setDonationSuccessful?: any;
  roundId: string;
  projectJoinRoundId: string;
  roundName: string;
};

export const token: tokenGroup[] = tokens;

export const ProjectDonationSimulator = ({
  projectDetails,
  height,
  width,
  setDonationSuccessful,
  roundId,
  projectJoinRoundId,
  roundName,
}: ProjectDonationSimulatorProps) => {
  const [txnError, setTxnError] = useState<string | null>(null);
  const toast = useToast();
  const priceSol = useCurrentTokenPrice('solana');
  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    watch,
    register,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormType>({
    defaultValues: {
      amount: 1,
      token: token[0],
      matchingPoolDonation: 10,
    },
  });
  const { user } = useUserStore();
  const donation: number = watch('amount');
  const { publicKey } = useWallet();
  const selectedToken: tokenGroup = watch('token');

  // In component:
  const utils = trpc.useContext();
  const updateProjectRaise = trpc.contribution.updateProjectRaise.useMutation();

  const createContributionMutation = trpc.contribution.create.useMutation({
    onSuccess: async (data: any) => {
      setDonationSuccessful(true);

      SuccessToast({ toast, message: 'Donation Successful' });
      updateProjectRaise.mutate({
        projectId: projectDetails.id,
        projectJoinRoundId: projectJoinRoundId,
        roundId: roundId,
      });
      utils.contribution.getProjectContributors.invalidate({
        projectId: projectDetails.id, // check once if the value is right or not for project Id
      });
    },
    onError: (error) => {
      setTxnError('Trpc returned an error');
      FailureToast({ toast, message: 'Donation Failed' });
    },
  });
  const anchorWallet = useAnchorWallet();

  async function onSubmit(_values: any) {
    if (!priceSol.data) return;
    let sig: string | null = null;

    const balance = await getBalances(publicKey?.toBase58() as string);

    if (String(_values.token.value).includes('sol')) {
      if (balance.nativeBalance < _values.amount * LAMPORTS_PER_SOL) {
        return setTxnError('Insufficient balance');
      }
      if (((_values.amount * priceSol.data) as number) > 2500) {
        setTxnError('Cannot Donate amount above $2500');
        return;
      }
      sig = await donateSOL(
        roundName as string,
        projectDetails?.owner_publickey,
        projectDetails?.projectUserCount,
        _values.matchingPoolDonation,
        _values.amount,
        _values.amount * priceSol.data
      );
    } else {
      if (
        balance.tokens.find((e: any) => e.mint === _values.token.mainNetAdd)
          .amount < _values.amount
      ) {
        return setTxnError('Insufficient balance');
      }
      if ((_values.amount as number) > 2500) {
        setTxnError('Cannot Donate amount above $2500');
        return;
      }
      sig = await donateSPL(
        roundName as string,
        _values.token.mainNetAdd,
        projectDetails?.owner_publickey,
        projectDetails?.projectUserCount,
        _values.matchingPoolDonation,
        _values.amount, // token value direct because form is not taking near 0 values
        _values.amount * priceSol.data // multiply by 100 because of 2 decimal places
      );
    }

    if (!sig) return;

    createContributionMutation.mutate({
      projectId: projectDetails.id,
      roundId: roundId,
      split: _values.matchingPoolDonation,
      token: _values.token.value,
      totalAmount: _values.amount,
      usd: _values.amount * priceSol.data,
      tx: sig as string,
      userId: user?.id as string,
      projectJoinRoundId: projectJoinRoundId,
    });
    // onOpen();
  }

  const donateSPL = async (
    roundId: string,
    token: string,
    owner: string,
    count: number,
    split: number,
    total: number,
    usd: number
  ): Promise<string | null> => {
    try {
      const ix = await contributeSPL(
        anchorWallet as NodeWallet,
        roundId,
        token,
        owner,
        count, // project count
        split, // split
        total * 1000000, // total
        usd // usd value
      );
      const tx = new anchor.web3.Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = anchorWallet?.publicKey as anchor.web3.PublicKey;
      tx.add(ix!);
      const signed = await anchorWallet?.signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed!.serialize());

      return txid;
    } catch (error: any) {
      console.log(error);
      setTxnError(error.message || 'There was some error');
      return null;
    }
  };
  const getBalances = async (address: string) => {
    const { data } = await axios.get(
      `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
    );
    return data;
  };
  const donateSOL = async (
    roundId: string,
    owner: string,
    count: number,
    split: number,
    total: number,
    usd: number
  ): Promise<string | null> => {
    try {
      const ix = await contributeSOL(
        anchorWallet as NodeWallet,
        roundId,
        owner,
        count, // project count
        split,
        total,
        usd
      );
      const tx = new anchor.web3.Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = anchorWallet?.publicKey as anchor.web3.PublicKey;
      tx.add(ix!);
      const signed = await anchorWallet?.signTransaction(tx);
      const txid = await connection.sendRawTransaction(signed!.serialize());

      return txid;
    } catch (error: any) {
      setTxnError(error.message || 'There was some error');
      return null;
    }
  };
  const handleDonationEstimate = () => {
    if (watch('token').label.toLocaleLowerCase().includes('sol')) {
      return (watch('amount') * priceSol.data!) as number;
    } else {
      return watch('amount');
    }
  };
  const EstimatedAmmount = trpc.pool.findEstimated.useQuery({
    amount: handleDonationEstimate(),
    projectId: projectDetails.id,
    roundId: roundId,
  });

  return (
    <Stack
      w={{ base: '20rem', sm: '22rem', md: 'full' }}
      gap="40px"
      h="full"
      direction={'row'}
      overflow={'hidden'}
      maxW="90vw"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          width: 'full',
          height: '100%',
          display: 'flex',
          gap: '52px',
          flex: '1',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <VStack w="full" gap="32px">
          <FormControl isInvalid={Boolean(errors.amount)}>
            <FormLabel
              pb="12px"
              htmlFor="name"
              textStyle={{ base: 'title5', md: 'title4' }}
              color="neutral.11"
            >
              Enter Donation Amount
            </FormLabel>
            <HStack>
              <AmountInput
                donation={donation}
                register={register}
                errors={errors}
                token={tokens}
                control={control}
                watch={watch}
              />
            </HStack>
            <FormErrorMessage textStyle={{ base: 'body5', md: 'body4' }}>
              <>{errors.amount && errors.amount.message}</>
            </FormErrorMessage>
            {/* <WalletBalanceError selectedToken={selectedToken} data={data} /> */}
          </FormControl>
          <FormControl>
            <FormLabel
              textStyle={{ base: 'title6', md: 'title5' }}
              color="neutral.8"
              htmlFor="donation_to_matching_pool"
              pb="12px"
            >
              Donate to Cubik Matching Pool.
            </FormLabel>
            <HStack gap="0.1rem">
              {Array.from([0, 10, 15, 30]).map((percentage, key) => {
                return (
                  <VStack
                    cursor="pointer"
                    key={key}
                    backgroundColor={
                      watch('matchingPoolDonation') === percentage
                        ? '#14665B'
                        : '#242424'
                    }
                    _hover={{ outline: '1px solid #3E3E3E' }}
                    outline={
                      watch('matchingPoolDonation') === percentage
                        ? '1px solid #E0FFFD16'
                        : '1px solid #242424'
                    }
                    rounded="8px"
                    w="full"
                    h="2.5rem"
                    align={'center'}
                    justify="center"
                    onClick={() => {
                      setValue('matchingPoolDonation', percentage);
                    }}
                  >
                    <Box as="p" textStyle={'body4'} color="#E0FFFD">
                      {percentage}%
                    </Box>
                    {percentage === 10 ? (
                      <Box
                        position={'absolute'}
                        bottom="-15%"
                        bg="red"
                        rounded="full"
                        as="p"
                        fontSize="10px"
                        p="2px 8px"
                        fontWeight={'500'}
                        color="#14665B"
                        background="#E0FFFD"
                        textTransform={'uppercase'}
                      >
                        Popular
                      </Box>
                    ) : (
                      ''
                    )}
                  </VStack>
                );
              })}
            </HStack>
            <FormErrorMessage>
              {errors.matchingPoolDonation ? (
                <>{errors.matchingPoolDonation.message}</>
              ) : (
                <></>
              )}
            </FormErrorMessage>
          </FormControl>
        </VStack>
        <VStack w="full" gap="16px">
          <VStack w="full" align="center" gap="8px">
            <HStack w="full" justify={'space-between'}>
              <Box as="p" textStyle={'body4'}>
                Estimated Match
              </Box>
              <Center color="#A8F0E6" fontWeight="700">
                <FlipNumbers
                  height={20}
                  width={13}
                  color="#A8F0E6"
                  play
                  perspective={700}
                  numbers={
                    '$' + String((EstimatedAmmount.data ?? 0).toFixed(3))
                  }
                />
              </Center>
            </HStack>
            {/* <HStack w="full" justify={'space-between'}>
              <Box as="p" textStyle={'body5'} color="neutral.8">
                Matching pool contribution
              </Box>
              <Center color="#ADB8B6">
                <FlipNumbers
                  height={14}
                  width={10}
                  color="#ADB8B6"
                  play
                  perspective={700}
                  numbers={
                    '$' +
                    String(
                      watch('matchingPoolDonation') === 0
                        ? '0.0'
                        : (donation / watch('matchingPoolDonation')).toFixed(1)
                    )
                  }
                />
              </Center>
            </HStack> */}
          </VStack>
          {txnError && (
            <Alert status="error" variant="cubik">
              <AlertIcon />
              <AlertDescription
                fontSize={{ base: '10px', md: '11px', xl: '12px' }}
                lineHeight={{ base: '14px', md: '14px', xl: '16px' }}
              >
                {txnError}
              </AlertDescription>
            </Alert>
          )}
          <Button
            variant={'cubikFilled'}
            w="full"
            height="44px"
            mt={4}
            colorScheme="teal"
            isLoading={isSubmitting}
            loadingText="Confirming Transaction"
            type="submit"
          >
            Donate with wallet
          </Button>
        </VStack>
      </form>
      {/* <Graph
        width={width}
        height={height}
        maximumDonationValue={1000}
        donationAmount={donation}
        setValue={setValue}
        projectId={projectDetails.id}
      /> */}
    </Stack>
  );
};
