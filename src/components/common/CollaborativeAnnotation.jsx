import _ from "lodash";
import { BackendAPI } from '../common/API'
import { withRouter } from 'react-router-dom';

import React, {Component} from "react";
import {
  Button,
  Header,
  Icon,
  Input,
  Popup,
  Modal,
  Divider,
  Form,
  Tab,
  Grid,
  Card,
  CardContent
} from "semantic-ui-react";
import { instanceOf } from 'prop-types';
import CollabAnnoGeneSearch from  './CollabAnnoGeneSearch'
import OLSAutocomplete from  './OLSAutocomplete'
import { withCookies, Cookies } from 'react-cookie';

class CollaborativeAnnotation extends Component {

    static propTypes = {
		cookies: instanceOf(Cookies).isRequired
	}
    
    constructor() {
        super();
        this.OLSAutocomplete = React.createRef();
        this.AnnoGeneSearch = React.createRef();        
        this.state = {
            value: [],
            annoData: {},
            selected: [],
            showModal: false
        }
    }

    handleChange = (e, { name, value }) => {
        let annoData = this.state.annoData
        annoData[name] = value
        this.setState({ "annoData": annoData })
    }

    closeModal = () => {
        this.setState({showModal: false})
    }

    onFreeInputChange = (e) => {
        this.setState({freeInput: e.target.value})
    }
    
    handleTabChange = () => {
        this.setState({freeInput: ''})
    }
    
    sendData = (e) => {
        let annoData = this.state.annoData
        if (this.OLSAutocomplete.current) {
            annoData['obo_id'] = this.OLSAutocomplete.current.state.result['obo_id'],
            annoData['iri'] = this.OLSAutocomplete.current.state.result['iri'],
            annoData['label'] = this.OLSAutocomplete.current.state.result['label']
        } else {
            annoData['obo_id'] = "Manual Annotation"
            annoData['iri'] = ""
            annoData['label'] = this.state.freeInput
        }

        annoData["selectedMarkers"] = this.AnnoGeneSearch.current.state.value
        this.setState({ annoData: annoData, submitAction: e.target.value }, () => {
            BackendAPI.setColabAnnotationData(
                this.props.feature, 
                this.state.annoData, 
                {'orcidName': this.state.orcid_name, 'orcidID': this.state.orcid_id, 'orcidUUID': this.state.orcid_uuid},
                this.props.match.params.uuid,
                (response) => {
                    if (response.success) {
                       this.closeModal()
                    }
                    if (this.state.submitAction == 'submitNext' || this.state.submitAction == 'submitPrevious') {
                        BackendAPI.getNextCluster(this.props.feature.metadata['clusteringID'], this.props.feature.metadata['clusterID'], this.state.submitAction == 'submitNext' ? 'next' : 'previous', (response) => {
                            BackendAPI.updateFeature(this.props.id, response.featureType[0], response.feature[0], response.featureType[0], response.featureDescription[0], this.props.match.params.page, (e) => {
                            })

                        })
                    }
                })
            })
    }

    render() {

        const {annoData, selected, showModal, orcid_name, orcid_id, orcid_uuid} = this.state;

        var cardStyle = {
            display: "block",
            width: "100vw",
            transitionDuration: "0.3s"
            };

        let olsWidget = () => {
            return (
                <OLSAutocomplete ref={this.OLSAutocomplete}/>
            )
        }

        let annotationModal = (orcid_id, orcid_name) => {
            const panes = [
                {menuItem: 'Controlled Vocabulary', render: () => 
                    <Tab.Pane>
                        <Grid.Row>
                            {olsWidget()}
                        </Grid.Row>
                        <Grid.Row>
                            OLS Powered by <a href="https://www.ebi.ac.uk/ols/index" target="_blank">EBI OLS</a>
                        </Grid.Row>
                    </Tab.Pane>
                },
                {menuItem: 'Free Text', render: () => 
                <Tab.Pane>
                    <Input 
                        placeholder="Enter your annotation..."
                        onChange={this.onFreeInputChange}
                        value={this.state.freeInput}
                        />
                </Tab.Pane>}
            ]

            return (
            <Modal 
                as={Form} 
                className="collab-anno"
                onClose={() => this.closeModal()} 
                closeIcon 
                open={showModal}
                trigger={<Button onClick={() => {this.setState({showModal: true})}} className="anno-button">Add Annotation</Button>}
                // onSubmit={e => {this.sendData(e)}}
                id="annoForm">
                <Modal.Header>Add Annotation</Modal.Header>
                <Modal.Content>
                <Modal.Description>
                    <Divider horizontal>
                        <Header as="h4">Basic Information (Read-only)</Header>
                    </Divider>
                    <Card style={cardStyle}>
                        <CardContent>
                        <Form.Field>
                            <label>Cluster ID (read-only)</label>
                            <input value={this.props.feature.feature} disabled />
                        </Form.Field>
                        <Form.Field>
                            <label>Curator</label>
                            <input disabled value={orcid_id + " (" +  orcid_name + ")"}/>
                        </Form.Field>
                        </CardContent>
                    </Card>
                    <Divider horizontal>
                        <Header as="h4">Ontology Annotation (Required) </Header>
                    </Divider>
                    <Card style={cardStyle}>
                        <CardContent>
                        <Form.Field required> 
                            <label>Annotation Label</label>
                            <Tab panes={panes} onTabChange={this.handleTabChange}/>
                            {/* {olsWidget()}  */}
                        </Form.Field>
                        </CardContent>
                    </Card>
                    <Divider horizontal>
                        <Header as="h4">Evidence (Optional)</Header>
                    </Divider>
                    <Card style={cardStyle}>
                        <CardContent>
                        <Form.Field>
                            {/* https://react.semantic-ui.com/modules/dropdown/#usage-remote */}
                            <label>Gene Symbols</label>
                            List of namespaced markers. Use identifiers.org standards for
                            resolving (But we need FlyBase !
                            https://registry.identifiers.org/prefixregistrationrequest).
                            {/* <input placeholder="Search for genes..." /> */}
                            <CollabAnnoGeneSearch ref={this.AnnoGeneSearch}></CollabAnnoGeneSearch>
                        </Form.Field>

                        <Form.Field>
                            <label>Publication (Optional)</label>
                            A publication with evidence that marker maps to cell type.
                            <Form.Input 
                            name="publication" value={this.state.publication} onChange={this.handleChange} placeholder="DOI of publication" />
                        </Form.Field>
                        <Form.Field>
                            <label>Comment (Optional)</label>
                            Used to document how the mapping was made and to detail any
                            uncertainty.
                            <Form.Input 
                            name="comment" value={this.state.comment} onChange={this.handleChange} placeholder="Free text..." />
                        </Form.Field>
                        </CardContent>
                    </Card>
                    {/* <Button>Add Markers Entry</Button> */}
                </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                <Button form="annoForm" type="submit" value="submitNext" onClick={(e) => this.sendData(e)} secondary>
                    Submit and view next cluster<Icon name="right chevron" />
                </Button>
                <Button form="annoForm" type="submit" value="submit" onClick={(e) => this.sendData(e)} primary>
                    Submit Annotation <Icon name="right chevron" />

                </Button>
                </Modal.Actions>
            </Modal>
            );
        }



        if (orcid_name && orcid_id && orcid_uuid && orcid_name != "" && orcid_id != "" && orcid_uuid != "") {
            return(annotationModal(orcid_id, orcid_name))
        } else {
            return(
                <Popup 
                position='bottom left'
                content={<b>You must be logged in with an ORCID ID to annotate datasets! (See header)</b>}
                trigger={<span><Button className="anno-button" disabled >Add Annotation</Button> </span>} hoverable fluid/>
            )
        }

    }

    componentWillMount() {
        let orcid_name = this.props.cookies.get("scope_orcid_name")
        let orcid_id = this.props.cookies.get("scope_orcid_id")
        let orcid_uuid = this.props.cookies.get("scope_orcid_uuid")

        this.setState({
            orcid_name: orcid_name,
            orcid_id: orcid_id,
            orcid_uuid: orcid_uuid,
        })
    }

};

export default withCookies(withRouter(CollaborativeAnnotation));