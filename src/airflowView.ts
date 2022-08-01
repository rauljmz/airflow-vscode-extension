import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { encode } from 'base-64';

export class AirflowViewManager {

	view: vscode.TreeView<vscode.TreeItem>;
	treeDataProvider: AirflowTreeDataProvider;
	daglistResponse: Promise<ResponseData>;
	apiUrl: string = "http://localhost:8080/api/v1";
	apiUserName: string = 'airflow';
	apiPassword: string = 'airflow';
	context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.treeDataProvider = new AirflowTreeDataProvider();
		this.view = vscode.window.createTreeView('airflowView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.loadState();
		this.refresh();
		context.subscriptions.push(this.view);
	}

	refresh(): void {
		this.loadDags();
	}

	showInfoMessage(message: string): void {
		vscode.window.showInformationMessage(message);
	}

	showErrorMessage(message: string): void {
		vscode.window.showErrorMessage(message);
	}

	async addServer() {
		let apiUrlTemp = await vscode.window.showInputBox({ placeHolder: 'API Full URL (Exp:http://localhost:8080/api/v1)' });
		if (!apiUrlTemp) { return; }

		let userNameTemp = await vscode.window.showInputBox({ placeHolder: 'User Name' });
		if (!userNameTemp) { return; }

		let passwordTemp = await vscode.window.showInputBox({ placeHolder: 'Password' });
		if (!passwordTemp) { return; }

		this.apiUrl = apiUrlTemp;
		this.apiUserName = userNameTemp;
		this.apiPassword = passwordTemp;

		this.saveState();

		this.refresh();
	}

	async loadDags() {
		if (!this.apiUrl) { return; }
		if (!this.apiUserName) { return; }
		if (!this.apiPassword) { return; }

		let params = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + encode(this.apiUserName + ":" + this.apiPassword)
			}
		};

		this.daglistResponse = undefined;
		this.treeDataProvider.daglistResponse = this.daglistResponse;

		try {
			let response = await fetch(this.apiUrl + '/dags', params);

			this.daglistResponse = await response.json() as Promise<ResponseData>;
			this.treeDataProvider.daglistResponse = this.daglistResponse;
		} catch (error) {
			this.showErrorMessage('Can not connect to Airflow. Please check Url, UserName and Password.\n\n' + error.message);
		}

		this.treeDataProvider.refresh();

		this.view.title = this.apiUrl;
		//this.view.message = 'message';
	}

	saveState() {
		try {
			this.context.globalState.update('apiUrl', this.apiUrl);
			this.context.globalState.update('apiUserName', this.apiUserName);
			this.context.globalState.update('apiPassword', this.apiPassword);
		} catch (error) {
			
		}
	}

	loadState() {
		try {
			let apiUrlTemp: string = this.context.globalState.get('apiUrl');
			if (apiUrlTemp) { this.apiUrl = apiUrlTemp; }
	
			let apiUserNameTemp: string = this.context.globalState.get('apiUserName');
			if (apiUserNameTemp) { this.apiUserName = apiUserNameTemp; }
	
			let apiPasswordTemp: string = this.context.globalState.get('apiPassword');
			if (apiPasswordTemp) { this.apiPassword = apiPasswordTemp; }	
		} catch (error) {
			
		}
	}
}

export class AirflowTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;
	daglistResponse: Promise<ResponseData>;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getChildren(element: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (!element) {
			let dagList: vscode.TreeItem[] = [];

			if (this.daglistResponse) {
				for (var dag of this.daglistResponse["dags"]) {
					if (dag) {
						let treeItem = new vscode.TreeItem(dag["dag_id"]);
						treeItem.iconPath = {
							light: '../media/light/python-3.svg',
							dark: '../media/dark/python-3.svg'
						};
						dagList.push(treeItem);
					}
				}
			}

			return Promise.resolve(dagList);
		}
		return Promise.resolve([]);
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}
}


async function activate(context) {
	const state = stateManager(context)

	const {
		lastPaletteTitleApplied
	} = state.read()

	await state.write({
		lastPaletteTitleApplied: 'foo bar'
	})

}


function stateManager(context) {
	return {
		read,
		write
	}

	function read() {
		return {
			lastPaletteTitleApplied: context.globalState.get('lastPaletteApplied')
		}
	}

	async function write(newState) {
		await context.globalState.update('lastPaletteApplied', newState.lastPaletteTitleApplied)
	}
}

interface ResponseData {
	"dags": [
		{
			"dag_id": "string",
			"root_dag_id": "string",
			"is_paused": true,
			"is_active": true,
			"is_subdag": true,
			"last_parsed_time": "2019-08-24T14:15:22Z",
			"last_pickled": "2019-08-24T14:15:22Z",
			"last_expired": "2019-08-24T14:15:22Z",
			"scheduler_lock": true,
			"pickle_id": "string",
			"default_view": "string",
			"fileloc": "string",
			"file_token": "string",
			"owners": [
				"string"
			],
			"description": "string",
			"schedule_interval": {
				"__type": "string",
				"days": 0,
				"seconds": 0,
				"microseconds": 0
			},
			"timetable_description": "string",
			"tags": [
				{
					"name": "string"
				}
			],
			"max_active_tasks": 0,
			"max_active_runs": 0,
			"has_task_concurrency_limits": true,
			"has_import_errors": true,
			"next_dagrun": "2019-08-24T14:15:22Z",
			"next_dagrun_data_interval_start": "2019-08-24T14:15:22Z",
			"next_dagrun_data_interval_end": "2019-08-24T14:15:22Z",
			"next_dagrun_create_after": "2019-08-24T14:15:22Z"
		}
	],
	"total_entries": 0
}