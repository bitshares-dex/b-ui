import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import BaseModal from "./BaseModal";
import {ChainStore} from "bitsharesjs";
import AccountStore from "stores/AccountStore";
import {Asset} from "common/MarketClasses";
import {debounce, isNaN} from "lodash-es";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";
import LoadingIndicator from "../LoadingIndicator";
import LogsActions from "actions/LogsActions";
import Screenshot from "lib/common/Screenshot";

import {connect} from "alt-react";

class ReportModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.nestedRef = null;

        ZfApi.subscribe("transaction_confirm_actions", (name, msg) => {
            if (msg == "close") {
                this.setState({hidden: false});
            }
        });
    }

    getInitialState() {
        return {
            open: false,
            loadingImage: false,
            memo: "",
            hidden: false,
            logsCopySuccess: false
        };
    }

    show() {
        this.getLogs();
        this.setState({open: true, hidden: false}, () => {
            ZfApi.publish(this.props.id, "open");
        });
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onClose = (publishClose = true) => {
        ZfApi.unsubscribe("transaction_confirm_actions");
        this.setState(
            {
                open: false,
                loadingImage: false,
                memo: "",
                hidden: false,
                logsCopySuccess: false
            },
            () => {
                if (publishClose) ZfApi.publish(this.props.id, "close");
            }
        );
    };

    downloadScreenshot = () => {
        this.setState({
            loadingImage: true
        });

        // Take screenshot
        Screenshot(() => {
            this.setState({
                loadingImage: false
            });
        });
    };

    getLogs = () => {
        LogsActions.getLogs().then(data => {
            this.setState({
                memo: JSON.stringify(data)
            });
        });
    };

    copyLogs = () => {
        const copyText = document.getElementById("logsText");
        copyText.select();
        document.execCommand("copy");

        this.setState({
            logsCopySuccess: true
        });
    };

    render() {
        let {open, hidden, memo, loadingImage, logsCopySuccess} = this.state;

        return !open ? null : (
            <div id="report_modal" className={hidden || !open ? "hide" : ""}>
                <BaseModal
                    id={this.props.id}
                    overlay={true}
                    onClose={() => this.onClose(this, false)}
                >
                    <div className="grid-block vertical no-overflow">
                        {/*  M E M O  */}
                        <div className="content-block transfer-input">
                            {memo && memo.length ? (
                                <label className="right-label">
                                    {memo.length}
                                </label>
                            ) : null}
                            <Translate
                                className="left-label tooltip"
                                component="label"
                                content="transfer.memo"
                            />
                            <textarea
                                id="logsText"
                                style={{marginBottom: 0}}
                                rows="3"
                                value={memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                            {/* warning */}
                            {this.state.propose ? (
                                <div
                                    className="error-area"
                                    style={{position: "absolute"}}
                                >
                                    <Translate
                                        content="transfer.warn_name_unable_read_memo"
                                        name={this.state.from_name}
                                    />
                                </div>
                            ) : null}
                        </div>
                        <div className="content-block transfer-input">
                            <div className="no-margin no-padding">
                                <div
                                    className="small-6"
                                    style={{
                                        display: "inline-block",
                                        paddingRight: "10px"
                                    }}
                                >
                                    <div
                                        className="button primary"
                                        onClick={this.downloadScreenshot}
                                    >
                                        <Translate content="modal.report.takeScreenshot" />
                                    </div>
                                </div>
                                <div
                                    className="small-6"
                                    style={{
                                        display: "inline-block",
                                        paddingRight: "10px"
                                    }}
                                >
                                    <div
                                        className="button primary"
                                        onClick={this.copyLogs}
                                    >
                                        <Translate content="modal.report.copyErrors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {loadingImage && (
                            <div style={{textAlign: "center"}}>
                                <LoadingIndicator type="three-bounce" />
                            </div>
                        )}
                        {logsCopySuccess && (
                            <p>
                                <Translate content="modal.report.copySuccess" />
                            </p>
                        )}
                    </div>
                </BaseModal>
            </div>
        );
    }
}

class ReportModalConnectWrapper extends React.Component {
    render() {
        return <ReportModal {...this.props} ref={this.props.refCallback} />;
    }
}

ReportModalConnectWrapper = connect(
    ReportModalConnectWrapper,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                tabIndex: props.tabIndex || 0
            };
        }
    }
);

export default ReportModalConnectWrapper;
