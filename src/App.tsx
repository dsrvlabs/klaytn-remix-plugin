import React from 'react';
import { Container, Form, InputGroup, Tooltip, Button, OverlayTrigger } from 'react-bootstrap';
import Compiler from './components/Compiler';
import SmartContracts from './components/SmartContracts';
import { InterfaceContract } from './components/Types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Caver = require('caver-js');

const App: React.FunctionComponent = () => {
	const [account, setAccount] = React.useState<string>('');
	const [balance, setBalance] = React.useState<string>('');
	const [networkId, setNetworkId] = React.useState<number>(0);
	const [busy, setBusy] = React.useState<boolean>(false);
	const [caver] = React.useState<any>(
		(window as { [key: string]: any }).klaytn ? new Caver((window as { [key: string]: any }).klaytn) : null
	);
	const [atAddress, setAtAddress] = React.useState<string>('');
	const [contracts, setContracts] = React.useState<InterfaceContract[]>([]);
	const [selected, setSelected] = React.useState<InterfaceContract | null>(null);

	React.useEffect(() => {
		updateBalance(account);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [account]);

	async function connect() {
		if (caver && !account) {
			setBusy(true);
			const provider = (window as { [key: string]: any }).klaytn;
			const accounts = await provider.enable();
			if (accounts.length) {
				setAccount(accounts[0]);
			}
			const { klaytn } = window as { [key: string]: any };
			if (klaytn) {
				klaytn.on('networkChanged', () => {
					setNetworkId(parseInt(klaytn.networkVersion, 10));
				});
			}
			setBusy(false);
		}
	}

	async function updateBalance(address: string) {
		if (address !== '') {
			const b = await caver.klay.getBalance(account);
			setBalance(caver.utils.fromWei(b));
		}
	}

	function addNewContract(contract: InterfaceContract) {
		setContracts(contracts.concat([contract]));
	}

	return (
		<div className="App">
			<Container>
				<Form>
					<Form.Group>
						<Form.Text className="text-muted">
							<small>ACCOUNT</small>
						</Form.Text>
						<InputGroup>
							<Form.Control type="text" placeholder="Account" value={account} size="sm" readOnly />
							<InputGroup.Append hidden={account !== ''}>
								<OverlayTrigger
									placement="left"
									overlay={
										<Tooltip id="overlay-connect" hidden={account !== ''}>
											Connect to Wallet
										</Tooltip>
									}
								>
									<Button variant="warning" block size="sm" disabled={busy} onClick={connect}>
										<small>Connect</small>
									</Button>
								</OverlayTrigger>
							</InputGroup.Append>
						</InputGroup>
					</Form.Group>
					<Form.Group>
						<Form.Text className="text-muted">
							<small>BALANCE (KLAY)</small>
						</Form.Text>
						<InputGroup>
							<Form.Control type="text" placeholder="Account" value={balance} size="sm" readOnly />
						</InputGroup>
					</Form.Group>
				</Form>
				<hr />
				<Compiler
					caver={account ? caver : null}
					networkId={networkId}
					busy={busy}
					setBusy={setBusy}
					addNewContract={addNewContract}
					setSelected={setSelected}
					updateBalance={updateBalance}
				/>
				<p className="text-center mt-3">
					<small>OR</small>
				</p>
				<InputGroup className="mb-3">
					<Form.Control
						value={atAddress}
						placeholder="contract address"
						onChange={(e) => {
							setAtAddress(e.target.value);
						}}
						size="sm"
						disabled={busy || account === '' || !selected}
					/>
					<InputGroup.Append>
						<OverlayTrigger
							placement="left"
							overlay={<Tooltip id="overlay-ataddresss">Use deployed Contract address</Tooltip>}
						>
							<Button
								variant="primary"
								size="sm"
								disabled={busy || account === '' || !selected}
								onClick={() => {
									setBusy(true);
									if (selected) {
										addNewContract({ ...selected, address: atAddress });
									}
									setBusy(false);
								}}
							>
								<small>At Address</small>
							</Button>
						</OverlayTrigger>
					</InputGroup.Append>
				</InputGroup>
				<hr />
				<SmartContracts
					caver={account ? caver : null}
					networkId={networkId}
					busy={busy}
					setBusy={setBusy}
					contracts={contracts}
					updateBalance={(a) => updateBalance(a)}
				/>
			</Container>
		</div>
	);
};

export default App;
