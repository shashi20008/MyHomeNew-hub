'use strict';
import React, { Component } from 'react';
import { Container, Row } from 'react-bootstrap';

import * as API from '../common/api';
import { getViewPortWidth, noop } from '../common/helper';
import Nav from '../components/nav';
import LoginComponent from '../components/login';
import SideNav from '../components/side-nav';
import MainSectionContainer from './MainSectionContainer';
import RegistrationModal from '../components/registration';
import CreateClientModal from '../components/create-client-modal';
import ExistingClientsModal from '../components/existing-clients-modal';

class PageContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedin: true,
      isMobile: getViewPortWidth() <= 768,
      registration: false
    };
    this.onLogin = this.onLogin.bind(this);
    this.getCurrentUserDetails = this.getCurrentUserDetails.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onNavToggle = this.onNavToggle.bind(this);
    this.navigateTo = this.navigateTo.bind(this);
    this.openRegistrationModal = this.openRegistrationModal.bind(this);

    setTimeout(this.getCurrentUserDetails, 10);
  }

  componentDidMount() {
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  getCurrentUserDetails () {
    API.getCurrentUserDetails()
      .then(user => {
        this.setState({
          loggedin: !!user,
          user
        });
      })
      .catch(err => {
        if(err === API.UNAUTHORIZED) {
          this.setState({
            loggedin: false,
            user: null
          });
        }
        console.error('an error occured: ', err);
      });
  }

  onResize() {
    const isMobile = getViewPortWidth() <= 768;
    if(this.state.isMobile !== isMobile) {
      this.setState({
        isMobile
      });
    }
  }

  onNavToggle() {
    this.setState({
      navOpen: !this.state.navOpen
    });
  }

  onLogin (username, password) {
    API.login(username, password)
      .then(user => {
        this.setState({
          loggedin: true,
          user
        });
      })
      .catch(err=> console.error);
  };

  navigateTo(event) {
    if(event === 'login') {
      return this.setState({
        loggedin: false
      });
    }

    if(event === 'logout') {
      return API.logout()
        .then(resp => this.setState({
          loggedin: false
        }))
        .catch(noop);
    }

    if(event === 'connect-app') {
      return this.setState({
        createClient: true
      });
    }

    if(event === 'existing-connections') {
      return this.setState({
        listExistingClients: true
      });
    }

    if(event === 'setup') {
      return window.setupNewDevice();
    }

    return this.setState({
      selectedPage: event
    });
  }

  openRegistrationModal() {
    this.setState({
      registration: true
    });
  }

  getPage() {
    if(this.state.registration) {
      return <RegistrationModal
        onClose={() => this.setState({ registration: false })} />;
    }

    if(!this.state.loggedin) {
      return <LoginComponent onLogin={this.onLogin} openRegistrationModal={this.openRegistrationModal} />;
    }
    
    return (
      <Container fluid={true}>
        <Row className="flex-xl-nowrap">
          <SideNav 
            displayNav={ !this.state.isMobile || this.state.navOpen } 
            navigate={this.navigateTo} />
          <MainSectionContainer 
            selectedPage={this.state.selectedPage} 
            user={this.state.user} 
            navigateTo={this.navigateTo} />
          {this.state.createClient && <CreateClientModal onClose={() => this.setState({createClient:false})} />}
          {this.state.listExistingClients && <ExistingClientsModal onClose={() => this.setState({listExistingClients:false})} />}
        </Row>
      </Container>
    );
  }

  render() {
    return (
      <React.Fragment>
        <Nav isMobile={ this.state.isMobile } onToggle={ this.onNavToggle } onLogout={ this.navigateTo.bind(this, 'logout')}/>
        { this.getPage() }
      </React.Fragment>
    );
  }
}

export default PageContainer;
