import React, { Component } from 'react';
import {TweenMax} from "gsap";
import { connect } from 'react-redux';

import low from '../../utils/low';
import * as actions from '../../actions';

import $ from 'jquery';

const Tools = require('../../utils/tools');
const { clipboard } = require('electron');
import { getContacts, deleteContact } from "../../Managers/SQLManager";

class AddressBook extends Component {
  constructor(props) {
    super(props);
    this._handleInput = this._handleInput.bind(this);
    this.rowClicked = this.rowClicked.bind(this);
    this.updateTable = this.updateTable.bind(this);
    this.getHeaderText = this.getHeaderText.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.loadContacts = this.loadContacts.bind(this);
  }

  componentDidMount() {
    this.loadContacts();

    $( window ).on('resize', () => {
      this.updateTable(this.props.friends);
    });

  }

  updateTable(friendList){
    $('#rows').css("height", $('#tableAddresses').height()-128);
    let numberOfChildren = friendList.length;
    let totalSize = numberOfChildren * 40; //40px height of each row
    let sizeOfContainer = $('#tableAddresses').height()-128;
    if(sizeOfContainer < totalSize){
      $('#rows').css("overflow-y", "auto");
      $('.headerAddresses').css("left", "-3px");
    }
    else{
      $(rows).css("overflow-y", "hidden");
      $('.headerAddresses').css("left", "0px");
    }
  }

  componentDidUpdate(){
    this.updateTable(this.props.friends);
  }

  componentWillUnmount() {
    $( window ).off('resize');
  }

  _handleInput(event) {
    const target = event.target;
    const name = target.name;
    const value = target.value;
    this.setState({ [name]: value });
  }

  rowClicked(friend) {
    console.log(friend)
    if(!this.props.sendPanel) return;
    clipboard.writeText(friend.address.address);
    $('#message').text(this.props.lang.addressCopiedBelow);
    TweenMax.fromTo('#message', 0.2, {autoAlpha: 0, scale: 0.5}, {autoAlpha: 1, scale: 1});
    TweenMax.to('#message', 0.2, {autoAlpha: 0, scale: 0.5, delay: 3});
    TweenMax.set('#addressSend', {autoAlpha: 0});
    this.props.setAddressSend(friend.address.address);
    if(friend.name === "") {
      console.log('friend name is null')
      this.props.setUsernameSend(undefined);
    } else if(friend.ansrecord != null) {
      this.props.setUsernameSend(friend.name, friend.ansrecord.code)
    }
    else this.props.setUsernameSend(friend.name);
    this.forceUpdate();
  }

  async loadContacts(){
    const friendList = await getContacts();
    this.props.setContacts(friendList);

    this.updateTable(friendList);
  }

  getHeaderText(){
    if(this.props.sendPanel){
      return(
        <p className="headerDescription">{ this.props.lang.selectAContactToSend1 } <span className="ecc">ecc</span> { this.props.lang.selectAContactToSend2 }</p>
      )
    }
    else{
      return null;
    }
  }
  handleMouseEnter(friend){
    if(this.props.sendPanel) return;
    this.props.setHoveredAddress(friend);
  }

  handleMouseLeave(){
    if(this.props.sendPanel) return;
    this.props.setHoveredAddress(undefined);
  }

  async deleteAddress(friend){
    const contactDeleted = await deleteContact(friend)
    console.log(contactDeleted)
    await this.loadContacts();
  }

  editContact(friend){}

  render() {
    let bin = Tools.getIconForTheme("deleteContact", false);
    let rowClassName = "row normalWeight tableRowCustom";

    return (
      <div className="tableCustom">
        <div className={this.props.sendPanel ? "tableHeaderNormal tableHeaderBig" : "tableHeaderNormal"}>
          <p className={this.props.sendPanel ? "tableHeaderTitle" : "tableHeaderTitle tableHeaderTitleSmall"}>{ this.props.lang.contacts }</p>
          {this.getHeaderText()}
        </div>
        <div className="tableContainer">
            <div className="row rowDynamic">
              <div className="col-sm-4 headerAddresses tableColumContactFix tableRowHeader">{ this.props.lang.name }</div>
              <div id="addressHeader" className="col-sm-7 headerAddresses tableRowHeader">{ this.props.lang.address }</div>
              <div className="col-sm-1 headerAddresses"></div>
            </div>
          <div id="rows" style={{width: "100%", padding: "0 0"}}>
          {this.props.friends.map((friend, index) => {
            return (
              <div className= {index % 2 !== 0 ? rowClassName : rowClassName + " tableRowEven"} onClick={this.rowClicked.bind(this, friend)} onMouseLeave={this.handleMouseLeave} onMouseEnter={this.handleMouseEnter.bind(this, friend)} style={{cursor: this.props.sendPanel ? "pointer" : "default"}} key={`friend_${index}`}>
                <div className={this.props.sendPanel ? "col-sm-4 tableColumn tableColumContactFix" : "col-sm-4 tableColumn tableColumContactFix selectableText"}>
                  {friend.ansrecord != null ? friend.ansrecord.name + '#' + friend.ansrecord.code: friend.name}
                </div>
                <div className={this.props.sendPanel ? "col-sm-7 tableColumn" : "col-sm-7 tableColumn selectableText"}>
                  {friend.address.address}
                </div>
                <div className="col-sm-1 tableColumn">
                  <img className="deleteContactIcon" onClick={this.deleteAddress.bind(this, friend)} style={{visibility: this.props.hoveredAddress === friend ? "visible" : "hidden"}}src={bin}/>
                  {/*<img className="deleteContactIcon" onClick={this.editContact.bind(this, friend)} style={{marginLeft: '5px', visibility: this.props.hoveredAddress === friend ? "visible" : "hidden"}}src={bin}/>*/}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return{
    lang: state.startup.lang,
    hoveredAddress: state.application.hoveredAddress,
    friends: state.application.friends
  };
};

export default connect(mapStateToProps, actions)(AddressBook);
