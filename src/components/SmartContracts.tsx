import React from 'react';
import { Alert, Accordion, Button, Card, Form, InputGroup } from 'react-bootstrap';
import copy from 'copy-to-clipboard';
import { CSSTransition } from 'react-transition-group';
import { AbiInput, AbiItem } from 'web3-utils';
import { InterfaceContract } from './Types';
import Method from './Method';
import './animation.css';

const EMPTYLIST = 'Currently you have no contract instances to interact with.';

interface InterfaceDrawMethodProps {
	caver: any;
	busy: boolean;
	setBusy: (state: boolean) => void;
	abi: AbiItem;
	address: string;
	updateBalance: (address: string) => void;
}

const DrawMethod: React.FunctionComponent<InterfaceDrawMethodProps> = (props) => {
	const [error, setError] = React.useState<string>('');
	const [success, setSuccess] = React.useState<string>('');
	const [value, setValue] = React.useState<string>('');
	const [args, setArgs] = React.useState<{ [key: string]: string }>({});
	const { caver, busy, /* setBusy, */ abi, address, updateBalance } = props;

	React.useEffect(() => {
		const temp: { [key: string]: string } = {};
		abi.inputs?.forEach((element: AbiInput) => {
			temp[element.name] = '';
		});
		setArgs(temp);
	}, [abi.inputs]);

	function buttonVariant(stateMutability: string | undefined): string {
		switch (stateMutability) {
			case 'view':
			case 'pure':
				return 'primary';
			case 'nonpayable':
				return 'warning';
			case 'payable':
				return 'danger';
			default:
				break;
		}
		return '';
	}

	return (
		<>
			<Method
				abi={abi}
				setArgs={(name: string, value2: string) => {
					args[name] = value2;
				}}
			/>
			<Alert variant="danger" onClose={() => setError('')} dismissible hidden={error === ''}>
				<small>{error}</small>
			</Alert>
			<Alert variant="success" onClose={() => setSuccess('')} dismissible hidden={success === ''}>
				<small>{success}</small>
			</Alert>
			<InputGroup className="mb-3">
				<InputGroup.Prepend>
					<Button
						variant={buttonVariant(abi.stateMutability)}
						block
						size="sm"
						disabled={busy || !caver}
						onClick={async () => {
							// setBusy(true)
							const parms: string[] = [];
							abi.inputs?.forEach((item: AbiInput) => {
								parms.push(args[item.name]);
							});
							const newContract = new caver.klay.Contract(JSON.parse(JSON.stringify([abi])), address);
							const accounts = await caver.klay.getAccounts();
							if (abi.stateMutability === 'view' || abi.stateMutability === 'pure') {
								try {
									const txReceipt = abi.name
										? await newContract.methods[abi.name](...parms).call({ from: accounts[0] })
										: null;
									if (typeof txReceipt === 'object') {
										setSuccess(JSON.stringify(txReceipt, null, 4));
									} else {
										setValue(txReceipt);
									}
									// TODO: LOG
								} catch (e: any) {
									// console.error(error)
									setError(e.message ? e.message : e.toString());
								}
							} else {
								try {
									if (abi.name) {
										const rawTx = {
											from: accounts[0],
											to: address,
											data: newContract.methods[abi.name](...parms).encodeABI(),
										};
										const gas = await caver.klay.estimateGas(rawTx);
										const gasLimit = parseInt((caver.utils.hexToNumber(gas) * 1.5).toString(), 10).toString();
										const txReceipt = await caver.klay.sendTransaction({
											type: 'SMART_CONTRACT_EXECUTION',
											value: 0, // TODO
											gas: gasLimit,
											...rawTx,
										});
										// console.log(txReceipt)
										setError('');
										setSuccess(JSON.stringify(txReceipt, null, 2));
										updateBalance(accounts[0]);
									} else {
										setError('abi name error');
									}
									// TODO: LOG
								} catch (e: any) {
									// console.error(error)
									setError(e.message ? e.message : e.toString());
								}
							}
							// setBusy(false)
						}}
					>
						<small>{abi.stateMutability === 'view' || abi.stateMutability === 'pure' ? 'call' : 'transact'}</small>
					</Button>
					<Button
						variant={buttonVariant(abi.stateMutability)}
						size="sm"
						className="mt-0 pt-0 float-right"
						onClick={() => {
							if (abi.name) {
								try {
									const parms: string[] = [];
									abi.inputs?.forEach((item: AbiInput) => {
										if (args[item.name]) {
											parms.push(args[item.name]);
										}
									});
									const newContract = new caver.klay.Contract(JSON.parse(JSON.stringify([abi])), address);
									copy(newContract.methods[abi.name](...parms).encodeABI());
								} catch (e: any) {
									console.log(e.toString());
								}
							}
						}}
					>
						<i className="far fa-copy" />
					</Button>
				</InputGroup.Prepend>
				<Form.Control
					value={value}
					size="sm"
					readOnly
					hidden={!(abi.stateMutability === 'view' || abi.stateMutability === 'pure')}
				/>
			</InputGroup>
		</>
	);
};

const ContractCard: React.FunctionComponent<{
	caver: any;
	networkId: number;
	busy: boolean;
	setBusy: (state: boolean) => void;
	contract: InterfaceContract;
	index: number;
	remove: () => void;
	updateBalance: (address: string) => void;
}> = ({ caver, networkId, busy, setBusy, contract, index, remove, updateBalance }) => {
	const [enable, setEnable] = React.useState<boolean>(true);

	function DrawMathods() {
		const list = contract.abi ? contract.abi : [];
		const items = list.map((abi: AbiItem, id: number) => (
			<Accordion key={`Methods_A_${index.toString()}`}>
				<Card>
					<Accordion.Toggle as={Card.Header} eventKey={`Methods_${id}`} className="p-1">
						<small>{abi.name}</small>
					</Accordion.Toggle>
					<Accordion.Collapse eventKey={`Methods_${id}`}>
						<Card.Body className="py-1 px-2">
							<DrawMethod
								caver={caver}
								busy={busy}
								setBusy={setBusy}
								abi={abi}
								address={contract.address}
								updateBalance={updateBalance}
							/>
						</Card.Body>
					</Accordion.Collapse>
				</Card>
			</Accordion>
		));
		return <>{items}</>;
	}

	return (
		<CSSTransition in={enable} timeout={300} classNames="zoom" unmountOnExit onExited={remove}>
			<Card className="mb-2">
				<Card.Header className="px-2 py-1">
					<strong className="align-middle">{contract.name}</strong>
					&nbsp;
					<small className="align-middle">{`${contract.address.substring(0, 6)}...${contract.address.substring(
						38
					)}`}</small>
					<Button
						className="float-right align-middle"
						size="sm"
						variant="link"
						onClick={() => {
							switch (networkId) {
								case 8217:
									window.open(`https://scope.scope.klaytn.com/account/${contract.address}`);
									break;
								case 1001:
									window.open(`https://baobab.scope.klaytn.com/account/${contract.address}`);
									break;
								default:
									break;
							}
						}}
					>
						<i className="fas fa-external-link-alt" />
					</Button>
					<Button
						className="float-right align-middle"
						size="sm"
						variant="link"
						onClick={() => {
							setEnable(false);
						}}
					>
						<i className="fas fa-trash-alt" />
					</Button>
				</Card.Header>
				{DrawMathods()}
			</Card>
		</CSSTransition>
	);
};

interface InterfaceSmartContractsProps {
	caver: any;
	networkId: number;
	busy: boolean;
	setBusy: (state: boolean) => void;
	contracts: InterfaceContract[];
	updateBalance: (address: string) => void;
}

const SmartContracts: React.FunctionComponent<InterfaceSmartContractsProps> = ({
	caver,
	networkId,
	busy,
	setBusy,
	contracts,
	updateBalance,
}) => {
	const [error, setError] = React.useState<string>('');
	const [count, setCount] = React.useState<number>(0);

	React.useEffect(() => {
		setCount(0);
		setError(EMPTYLIST);
	}, [contracts, busy]);

	function DrawContracts() {
		const items = contracts.map((data: InterfaceContract, index: number) => (
			<ContractCard
				caver={caver}
				networkId={networkId}
				busy={busy}
				setBusy={setBusy}
				contract={data}
				index={index}
				remove={() => {
					setCount(count + 1);
					setError(EMPTYLIST);
				}}
				updateBalance={updateBalance}
				key={`Contract_${index.toString()}`}
			/>
		));
		return <>{items}</>;
	}

	return (
		<div className="SmartContracts">
			<Alert variant="warning" className="text-center" hidden={contracts.length !== count}>
				<small>{error}</small>
			</Alert>
			{DrawContracts()}
		</div>
	);
};

export default SmartContracts;
