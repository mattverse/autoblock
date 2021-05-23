// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract HelloBlockchain
{
     //Set of States
    enum StateType { Request, Respond }

    //List of properties
    StateType public  State;
    address public  Requestor;
    address public  Responder;

    string public RequestMessage;
    string public ResponseMessage;

    event StateChanged(string stateData);

    //mapping (address => string) public accidents;
    string[] public Accidents;
    

    // constructor function
    constructor(string memory message)
    {
        RequestMessage = message;
        State = StateType.Request;

        emit StateChanged('Request');
    }

    // call this function to send a request
    function SendRequest(string memory requestMessage) public
    {
        Requestor = msg.sender;

        RequestMessage = requestMessage;
        State = StateType.Request;
    }

    // call this function to send a response
    function SendResponse(string memory responseMessage) public
    {
        Responder = msg.sender;

        // call ContractUpdated() to record this action
        ResponseMessage = responseMessage;
        State = StateType.Respond;

        emit StateChanged('Response');
    }
    
    function getMessage() public view returns (string memory)
    {
    if (State == StateType.Request)
        return RequestMessage;
    else
        return ResponseMessage;
    }


    function addAccident(string memory hash) public returns (uint count)
    {
        Accidents.push(hash);
        Accidents.push(hash);
        return Accidents.length;
    }

    function getLastAccident() public returns (string memory)
    {
        //return accidents[msg.sender]
        return Accidents[Accidents.length - 1];
    }

    function getNumberOfAccidents() public view returns (uint) {
        return Accidents.length;
    }
}