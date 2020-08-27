import React, { useContext, useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';

import { Formik, Form, Field, ErrorMessage } from 'formik';

import {
  FormContainer,
  FieldContainer,
  DropdownInputDiv,
} from '../../App.styles';

import {
  LoaderContext,
  DaoServiceContext,
  DaoDataContext,
  CurrentUserContext,
} from '../../contexts/Store';
import Loading from '../shared/Loading';

import { withApollo, useQuery } from 'react-apollo';
import TributeInput from './TributeInput';
import Expandable from '../shared/Expandable';
import { ProposalSchema } from './Validation';
import shortid from 'shortid';
import TokenSelect from './TokenSelect';
import { valToDecimalString } from '../../utils/Helpers';
import { GET_MOLOCH_V2X } from '../../utils/Queries';

const NewMemberForm = (props) => {
  const { history } = props;

  const [gloading] = useContext(LoaderContext);
  const [formLoading, setFormLoading] = useState(false);
  const [tokenData, setTokenData] = useState([]);
  const [daoService] = useContext(DaoServiceContext);
  const [daoData] = useContext(DaoDataContext);
  const [currentUser] = useContext(CurrentUserContext);

  const options = {
    variables: { contractAddr: daoData.contractAddress },
    fetchPolicy: 'no-cache',
  };
  const query = GET_MOLOCH_V2X;

  const { loading, error, data } = useQuery(query, options);

  // get whitelist
  useEffect(() => {
    if (data && data.moloch) {
      const depositTokenAddress = data.moloch.depositToken.tokenAddress;
      const depositToken = data.moloch.tokenBalances.find(
        (token) => token.token.tokenAddress === depositTokenAddress,
      );
      const tokenArray = data.moloch.tokenBalances.filter(
        (token) =>
          token.guildBank && token.token.tokenAddress !== depositTokenAddress,
      );
      tokenArray.unshift(depositToken);
      setTokenData(
        tokenArray.map((token) => ({
          label: token.token.symbol || token.tokenAddress,
          value: token.token.tokenAddress,
          decimals: token.token.decimals,
          balance: token.tokenBalance,
        })),
      );
    }
  }, [data]);

  if (loading) return <Loading />;
  if (error) {
    console.log('error', error);
  }

  const validateUnlockedBalance = async (amount, token) => {
    // this is triggered on any blur
    const balance = await daoService.token.balanceOfToken(token);
    if (amount && amount > balance) {
      return 'Not enough tokens to tribute';
    }

    const amountApproved = await daoService.token.unlocked(token);
    if (!amount || amountApproved > 0) {
      return false;
    }
    return 'Tribute token must be unlocked';
  };

  return (
    <FormContainer>
      <h1 className="Pad">New Member Proposal</h1>
      <div>
        {formLoading && <Loading />}
        {gloading && <Loading />}

        <div>
          {tokenData.length && currentUser.username ? (
            <Formik
              initialValues={{
                title: '',
                description: '',
                link: '',
                tributeOffered: 0,
                tributeToken: tokenData[0].value,
                paymentRequested: 0,
                sharesRequested: 0,
                lootRequested: 0,
              }}
              validationSchema={ProposalSchema}
              onSubmit={async (values, { setSubmitting }) => {
                console.log(values);
                setFormLoading(true);
                setSubmitting(true);

                const uuid = shortid.generate();
                const detailsObj = JSON.stringify({
                  id: uuid,
                  title: values.title,
                  description: values.description,
                  link: values.link,
                });

                try {
                  await daoService.mcDao.submitProposal(
                    values.sharesRequested,
                    values.lootRequested,
                    valToDecimalString(
                      values.tributeOffered,
                      values.tributeToken,
                      tokenData,
                    ),
                    values.tributeToken,
                    0,
                    tokenData[0].value,
                    detailsObj,
                  );
                  setSubmitting(false);
                  setFormLoading(false);
                  history.push(`/dao/${daoService.daoAddress}/success`);
                } catch (err) {
                  console.log('Error: ', err);
                  setSubmitting(false);
                  setFormLoading(false);
                }
              }}
            >
              {({ isSubmitting, ...props }) => (
                <Form className="Form">
                  <Field name="title">
                    {({ field, form }) => (
                      <FieldContainer
                        className={field.value ? 'Field HasValue' : 'Field '}
                      >
                        <label>Title</label>
                        <input type="text" {...field} />
                      </FieldContainer>
                    )}
                  </Field>
                  <ErrorMessage name="title">
                    {(msg) => <div className="Error">{msg}</div>}
                  </ErrorMessage>
                  <Field name="description">
                    {({ field, form }) => (
                      <FieldContainer
                        className={field.value ? 'Field HasValue' : 'Field '}
                      >
                        <label>Short Description</label>
                        <textarea rows="5" {...field} />
                      </FieldContainer>
                    )}
                  </Field>
                  <ErrorMessage name="description">
                    {(msg) => <div className="Error">{msg}</div>}
                  </ErrorMessage>
                  <Field name="link">
                    {({ field, form }) => (
                      <FieldContainer
                        className={field.value ? 'Field HasValue' : 'Field '}
                      >
                        <label>Link</label>
                        <input type="text" {...field} />
                      </FieldContainer>
                    )}
                  </Field>
                  <ErrorMessage name="link">
                    {(msg) => <div className="Error">{msg}</div>}
                  </ErrorMessage>
                  <Field name="sharesRequested">
                    {({ field, form }) => (
                      <FieldContainer
                        className={
                          field.value !== '' ? 'Field HasValue' : 'Field '
                        }
                      >
                        <label>Shares Requested</label>
                        <input min="0" step="1" type="number" {...field} />
                      </FieldContainer>
                    )}
                  </Field>
                  <ErrorMessage name="sharesRequested">
                    {(msg) => <div className="Error">{msg}</div>}
                  </ErrorMessage>
                  <DropdownInputDiv>
                    <Field
                      name="tributeOffered"
                      component={TributeInput}
                      label="Token Tribute"
                      token={props.values.tributeToken}
                      validate={() =>
                        validateUnlockedBalance(
                          props.values.tributeOffered,
                          props.values.tributeToken,
                        )
                      }
                    ></Field>
                    <Field
                      name="tributeToken"
                      component={TokenSelect}
                      label="Token Tribute"
                      data={tokenData}
                    ></Field>
                  </DropdownInputDiv>
                  <ErrorMessage name="tributeOffered">
                    {(msg) => (
                      <div className="Error">Tribute Offered: {msg}</div>
                    )}
                  </ErrorMessage>
                  <ErrorMessage name="tributeToken">
                    {(msg) => <div className="Error">Tribute Token: {msg}</div>}
                  </ErrorMessage>

                  <Expandable label="Loot">
                    <Field name="lootRequested">
                      {({ field, form }) => (
                        <FieldContainer
                          className={
                            field.value !== '' ? 'Field HasValue' : 'Field '
                          }
                        >
                          <label>Loot Requested (Non-voting Shares)</label>
                          <input min="0" step="1" type="number" {...field} />
                        </FieldContainer>
                      )}
                    </Field>
                  </Expandable>
                  <ErrorMessage name="lootRequested">
                    {(msg) => <div className="Error">{msg}</div>}
                  </ErrorMessage>
                  <button type="submit" disabled={isSubmitting}>
                    Submit
                  </button>
                </Form>
              )}
            </Formik>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </FormContainer>
  );
};

export default withRouter(withApollo(NewMemberForm));
