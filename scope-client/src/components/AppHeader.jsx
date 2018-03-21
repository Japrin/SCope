import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Icon, Button, Menu } from 'semantic-ui-react';
import { BackendAPI } from './common/API';
const moment = require('moment');
const timer = 60 * 1000;

class AppHeader extends Component {

	constructor(props) {
		super(props);
		this.state = {
			timeout: props.timeout
		}
	}

	render() {
		const { match, location } = this.props;
		const { timeout } = this.state;
		let metadata = BackendAPI.getLoomMetadata(match.params.loom);

		let menu = [
			{
				display: true,
				path: 'welcome',
				title: 'SCope',
				icon: 'home'
			},
			{
				display: metadata ? true : false,
				path: 'dataset',
				title: 'Dataset info',
				icon: false
			},
			{
				display: metadata ? true : false,
				path: 'gene',
				title: 'Gene',
				icon: false
			},
			{
				display: metadata ? true : false,
				path: 'geneset',
				title: 'Gene set',
				icon: false
			},
			{
				display: metadata && metadata.fileMetaData.hasRegulonsAUC ? true : false,
				path: 'regulon',
				title: 'Regulon',
				icon: false
			},
			{
				display: metadata && metadata.cellMetaData  && metadata.cellMetaData.annotations.length ? true : false,
				path: 'compare',
				title: 'Compare',
				icon: false
			},
			{
				display: true,
				path: 'tutorial',
				title: 'Tutorial',
				icon: false
			},
			{
				display: true,
				path: 'about',
				title: 'About',
				icon: false
			},
		];

		return (
			<Menu secondary attached="top" className="vib" inverted>
				<Menu.Item>
					<Icon name="sidebar" onClick={this.toggleSidebar.bind(this)} className="pointer" title="Toggle sidebar" />
				</Menu.Item>

				{menu.map((item, i) => item.display &&
					<Menu.Item key={i}>
						<Link to={'/' + [match.params.uuid, match.params.loom, item.path].join('/')}>
							<Button basic active={match.params.page == item.path}>
								{item.icon &&
									<Icon name={item.icon} />
								}
								{item.title}
							</Button>
						</Link>
					</Menu.Item>
				)}

				<Menu.Item className="sessionInfo">
					Your session will be deleted in {moment.duration(timeout).humanize()} &nbsp;
					<Icon name="info circle" inverted title="Our servers can only store that much data. Your files will be removed after the session times out." />
				</Menu.Item>
			</Menu>
		);
	}

	componentWillMount() {
		this.timer = setInterval(() => {
			let timeout = this.state.timeout;
			timeout -= timer;
			this.setState({timeout});
			if (timeout <= 0) {
				clearInterval(this.timer);
				this.timer = null;
			}
		}, timer);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({timeout: nextProps.timeout});
	}

	componentWillUnmount() {
		if (this.timer)	clearInterval(this.timer);
	}
	
	toggleSidebar() {
		this.props.toggleSidebar();
		BackendAPI.setSidebarVisible(!BackendAPI.getSidebarVisible());
	}

}

export default withRouter(AppHeader);