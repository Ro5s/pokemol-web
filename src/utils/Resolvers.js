import Web3 from 'web3';
import axios from 'axios';
import bs58 from 'bs58';

import {
  determineProposalStatus,
  inGracePeriod,
  inVotingPeriod,
  inQueue,
  passedVotingAndGrace,
  determineProposalType,
} from './ProposalHelper';
import { TokenService } from './TokenService';
import { McDaoService } from './McDaoService';
import { GET_METADATA } from './Queries';

const _web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.REACT_APP_INFURA_URI),
);

export const resolvers = {
  Proposal: {
    status: (proposal, _args, { cache }) => {
      const { currentPeriod } = cache.readQuery({
        query: GET_METADATA,
      });

      return determineProposalStatus(
        proposal,
        +currentPeriod,
        +proposal.moloch.votingPeriodLength,
        +proposal.moloch.gracePeriodLength,
        proposal.moloch.version === '2x'
          ? proposal.moloch.version
          : +proposal.moloch.version,
      );
    },
    gracePeriod: (proposal, _args, { cache }) => {
      const { currentPeriod } = cache.readQuery({
        query: GET_METADATA,
      });

      if (
        inGracePeriod(
          proposal,
          currentPeriod,
          +proposal.moloch.votingPeriodLength,
          +proposal.moloch.gracePeriodLength,
        )
      ) {
        return (
          +proposal.startingPeriod +
          +proposal.moloch.votingPeriodLength +
          +proposal.moloch.gracePeriodLength -
          currentPeriod +
          1 // TODO: why plus 1 here? abort? ¯\_(ツ)_/¯
        );
      }
      return 0;
    },
    votingEnds: (proposal, _args, { cache }) => {
      const { currentPeriod } = cache.readQuery({
        query: GET_METADATA,
      });

      if (
        inVotingPeriod(
          proposal,
          currentPeriod,
          +proposal.moloch.votingPeriodLength,
        )
      ) {
        return (
          proposal.startingPeriod +
          +proposal.moloch.votingPeriodLength -
          currentPeriod
        );
      }
      return 0;
    },
    votingStarts: (proposal, _args, { cache }) => {
      const { currentPeriod } = cache.readQuery({ query: GET_METADATA });
      if (inQueue(proposal, currentPeriod)) {
        return proposal.startingPeriod - currentPeriod;
      }
      return 0;
    },
    readyForProcessing: (proposal, _args, { cache }) => {
      const { currentPeriod } = cache.readQuery({ query: GET_METADATA });
      if (
        passedVotingAndGrace(
          proposal,
          currentPeriod,
          +proposal.moloch.votingPeriodLength,
          +proposal.moloch.gracePeriodLength,
          proposal.moloch.version === '2x'
            ? proposal.moloch.version
            : +proposal.moloch.version,
        ) &&
        !proposal.processed
      ) {
        return true;
      }
      return false;
    },
    tributeTokenSymbol: async (proposal, _args, { cache }) => {
      const symbol = proposal.moloch.tokenBalances.find(
        (token) => token.token.tokenAddress === proposal.tributeToken,
      );
      return symbol ? symbol.token.symbol : null;
    },
    tributeTokenDecimals: async (proposal, _args, { cache }) => {
      const decimals = proposal.moloch.tokenBalances.find(
        (token) => token.token.tokenAddress === proposal.tributeToken,
      );

      return decimals ? decimals.token.decimals : null;
    },
    paymentTokenSymbol: async (proposal, _args, { cache }) => {
      if (proposal.paymentRequested > 0) {
        const symbol = proposal.moloch.tokenBalances.find(
          (token) => token.token.tokenAddress === proposal.paymentToken,
        );
        return symbol ? symbol.token.symbol : null;
      } else {
        return null;
      }
    },
    paymentTokenDecimals: async (proposal, _args, { cache }) => {
      if (proposal.paymentRequested > 0) {
        const decimals = proposal.moloch.tokenBalances.find(
          (token) => token.token.tokenAddress === proposal.paymentToken,
        );

        return decimals ? decimals.token.decimals : null;
      } else {
        return null;
      }
    },
    proposalType: (proposal, _args, { cache }) => {
      return determineProposalType(proposal);
    },
    ipfsDetails: async (proposal, _args, { cache }) => {
      if (proposal.details.slice(0, 2) === '0x') {
        const hashHex = '1220' + proposal.details.slice(2);
        const bytes = Buffer.from(hashHex, 'hex');
        const decodedHash = bs58.encode(bytes);

        try {
          if (proposal.proposalId !== '0' && proposal.proposalId !== '1') {
            const result = await axios.get(
              'https://gateway.ipfs.io/ipfs/' + decodedHash,
            );
            return result.data;
          }
          return {
            title: 'test proposal',
            description: 'test description',
            id: 'u' + proposal.proposalId,
          };
        } catch (err) {
          console.log(err);
        }
      }

      return null;
    },
  },

  Moloch: {
    meta: (_, _args, { cache }) => {
      return cache.readQuery({
        query: GET_METADATA,
      });
    },
  },
  TokenBalance: {
    symbol: async (tokenBalance, _args, { cache }) => {
      if (tokenBalance.guildBank) {
        const symbol = tokenBalance.token.symbol;

        return symbol;
      } else {
        return null;
      }

      // return null;
    },
    decimals: async (tokenBalance, _args, { cache }) => {
      if (tokenBalance.guildBank) {
        const decimals = tokenBalance.token.decimals;

        return +decimals;
      } else {
        return null;
      }
    },
    contractTokenBalance: async (tokenBalance, _args, { cache }) => {
      if (tokenBalance.guildBank) {
        const tokenService = new TokenService(
          _web3,
          tokenBalance.token.tokenAddress,
        );

        const balance = await tokenService.balanceOf(tokenBalance.moloch.id);

        return +balance;
      } else {
        return null;
      }
    },
    contractBabeBalance: async (tokenBalance, _args, { cache }) => {
      if (tokenBalance.guildBank) {
        const mcDaoService = new McDaoService(
          _web3,
          tokenBalance.moloch.id,
          null,
          2,
        );

        const balance = await mcDaoService.getUserTokenBalance(
          '0x000000000000000000000000000000000000baBe',
          tokenBalance.token.tokenAddress,
        );

        return +balance;
      } else {
        return null;
      }
    },
  },
  Token: {
    symbol: async (approvedToken, _args, { cache }) => {
      const symbol = approvedToken.symbol;
      return symbol;
    },
    decimals: async (approvedToken, _args, { cache }) => {
      const decimals = approvedToken.decimals;

      return +decimals;
    },
  },
};
